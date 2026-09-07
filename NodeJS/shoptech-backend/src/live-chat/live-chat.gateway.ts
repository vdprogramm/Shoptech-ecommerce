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

  // Admin or User joins
  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { role: string; userId?: string; guestId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.role === 'admin') {
      this.adminSockets.add(client.id);
      client.join('admins');
      console.log(`👨‍💼 Admin registered: ${client.id}`);
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
      userId?: string;
      guestId?: string;
      customerName?: string;
      senderRole: 'user' | 'admin' | 'guest';
      content: string;
      conversationId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    let conversation;

    // 1. Get or create conversation if user/guest sends a message
    if (data.senderRole === 'user' || data.senderRole === 'guest') {
      conversation = await this.liveChatService.getOrCreateConversation({
        userId: data.userId,
        guestId: data.guestId,
        customerName: data.customerName,
      });
    } else if (data.conversationId) {
      // Admin replying to existing conversation
      conversation = { _id: data.conversationId };
    }

    if (!conversation) return { error: 'Không tìm thấy cuộc hội thoại' };

    // 2. Save message
    const message = await this.liveChatService.saveMessage({
      conversationId: conversation._id.toString(),
      senderRole: data.senderRole,
      senderId: data.senderRole === 'admin' ? data.userId : data.userId, // simplified
      content: data.content,
    });

    // 3. Broadcast
    if (data.senderRole === 'admin') {
      // Send to specific user/guest
      const customerId = data.userId || data.guestId; // Need the customer ID to route.
      // Wait, we need to know who the customer is based on conversation.
      // For simplicity, we can broadcast the message to the "admins" room, and also to the specific customer socket if online.
      
      // Let's emit back to the admin who sent it (to confirm)
      // And emit to the specific customer. In this request, if we don't have customerId, we'd need to fetch conversation.
      // But let's assume the frontend sends the target `customerId` or we broadcast to a conversation room.
      
      // Better approach: everyone joins a room based on conversationId.
      this.server.to(conversation._id.toString()).emit('receive_message', message);
      
      // Also notify all admins to update their list
      this.server.to('admins').emit('conversation_updated', conversation);

    } else {
      // Customer sends message
      this.server.to(conversation._id.toString()).emit('receive_message', message);
      this.server.to('admins').emit('receive_message', message);
      this.server.to('admins').emit('conversation_updated', conversation);
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
}
