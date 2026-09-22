import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveChatService } from './live-chat.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/live-chat' })
export class LiveChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // Track online users/guests and admins
  private userSockets = new Map<string, string>(); // customer/guest id -> socket id
  private adminSockets = new Set<string>(); // socket ids of admins

  constructor(private readonly liveChatService: LiveChatService) {}

  handleConnection(client: Socket) {
    console.log(`💬 LiveChat Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove from maps
    this.adminSockets.delete(client.id);
    for (const [key, value] of this.userSockets.entries()) {
      if (value === client.id) {
        this.userSockets.delete(key);
        break;
      }
    }
    console.log(`🔴 LiveChat Disconnected: ${client.id}`);
  }

  // Vendor or User joins
  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { role: string; storeId?: string; userId?: string; guestId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.role === 'vendor' && data.storeId) {
      client.join(`store_${data.storeId}`);
      console.log(`👨‍💼 Vendor registered for store ${data.storeId}: ${client.id}`);
    } else {
      const id = data.userId || data.guestId;
      if (id) {
        this.userSockets.set(id, client.id);
        console.log(`👤 Customer registered: ${id} on socket ${client.id}`);
      }
    }
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: {
      storeId?: string;
      userId?: string;
      guestId?: string;
      customerName?: string;
      senderRole: 'user' | 'vendor' | 'guest';
      content: string;
      imageUrl?: string;
      conversationId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    let conversation;

    // 1. Get or create conversation if user/guest sends a message
    if (data.senderRole === 'user' || data.senderRole === 'guest') {
      if (!data.storeId) return { error: 'storeId is required' };
      conversation = await this.liveChatService.getOrCreateConversation({
        storeId: data.storeId,
        userId: data.userId,
        guestId: data.guestId,
        customerName: data.customerName,
      });
    } else if (data.conversationId) {
      // Vendor replying to existing conversation
      conversation = { _id: data.conversationId };
    }

    if (!conversation) return { error: 'Không tìm thấy cuộc hội thoại' };

    // 2. Save message
    const message = await this.liveChatService.saveMessage({
      conversationId: conversation._id.toString(),
      senderRole: data.senderRole,
      senderId: data.senderRole === 'vendor' ? data.userId : data.userId,
      content: data.content,
      imageUrl: data.imageUrl,
    });

    // 3. Broadcast
    if (data.senderRole === 'vendor') {
      // Broadcast to conversation room
      this.server.to(conversation._id.toString()).emit('receive_message', message);
      
      // Also notify vendor room (in case they have multiple tabs open)
      if (data.storeId) {
        this.server.to(`store_${data.storeId}`).emit('conversation_updated', conversation);
      }
    } else {
      // Customer sends message
      this.server.to(conversation._id.toString()).emit('receive_message', message);
      if (data.storeId) {
        this.server.to(`store_${data.storeId}`).emit('receive_message', message);
        this.server.to(`store_${data.storeId}`).emit('conversation_updated', conversation);
      }
    }

    return message;
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(conversationId);
    return { success: true };
  }

  @SubscribeMessage('revoke_message')
  async handleRevokeMessage(
    @MessageBody() data: { messageId: string; userId: string; storeId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.liveChatService.revokeMessage(data.messageId, data.userId);
      // Broadcast to conversation room
      this.server.to(message.conversationId.toString()).emit('message_revoked', { messageId: message._id });
      if (data.storeId) {
        this.server.to(`store_${data.storeId}`).emit('message_revoked', { messageId: message._id });
      }
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }
}
