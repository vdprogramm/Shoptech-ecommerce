import { io, Socket } from 'socket.io-client';

class LiveChatClient {
  private socket: Socket | null = null;
  private url = 'https://shoptech-api-ytxj.onrender.com/live-chat'; // Ensure port matches backend

  connect(role: string, userId?: string, guestId?: string, storeId?: string) {
    if (!this.socket) {
      this.socket = io(this.url, { transports: ['websocket'] });
      
      this.socket.on('connect', () => {
        console.log('LiveChat socket connected:', this.socket?.id);
        this.socket?.emit('register', { role, userId, guestId, storeId });
      });

      this.socket.on('disconnect', () => {
        console.log('LiveChat socket disconnected');
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(data: {
    storeId?: string;
    userId?: string;
    guestId?: string;
    customerName?: string;
    senderRole: 'user' | 'vendor' | 'guest';
    content: string;
    imageUrl?: string;
    conversationId?: string;
  }) {
    this.socket?.emit('send_message', data);
  }

  revokeMessage(data: { messageId: string; userId: string; storeId?: string }) {
    this.socket?.emit('revoke_message', data);
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', conversationId);
  }

  onReceiveMessage(callback: (message: any) => void) {
    this.socket?.on('receive_message', callback);
  }

  offReceiveMessage(callback?: (message: any) => void) {
    if (callback) {
      this.socket?.off('receive_message', callback);
    } else {
      this.socket?.off('receive_message');
    }
  }

  onMessageRevoked(callback: (data: { messageId: string }) => void) {
    this.socket?.on('message_revoked', callback);
  }

  offMessageRevoked(callback?: (data: { messageId: string }) => void) {
    if (callback) {
      this.socket?.off('message_revoked', callback);
    } else {
      this.socket?.off('message_revoked');
    }
  }

  onConversationUpdated(callback: (conversation: any) => void) {
    this.socket?.on('conversation_updated', callback);
  }

  offConversationUpdated(callback?: (conversation: any) => void) {
    if (callback) {
      this.socket?.off('conversation_updated', callback);
    } else {
      this.socket?.off('conversation_updated');
    }
  }
}

export const liveChatClient = new LiveChatClient();
