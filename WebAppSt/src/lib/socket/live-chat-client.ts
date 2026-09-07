import { io, Socket } from 'socket.io-client';

class LiveChatClient {
  private socket: Socket | null = null;
  private url = 'http://localhost:5000/live-chat'; // Ensure port matches backend

  connect(role: string, userId?: string, guestId?: string) {
    if (!this.socket) {
      this.socket = io(this.url, { transports: ['websocket'] });
      
      this.socket.on('connect', () => {
        console.log('LiveChat socket connected:', this.socket?.id);
        this.socket?.emit('register', { role, userId, guestId });
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
    userId?: string;
    guestId?: string;
    customerName?: string;
    senderRole: 'user' | 'admin' | 'guest';
    content: string;
    conversationId?: string;
  }) {
    this.socket?.emit('send_message', data);
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
