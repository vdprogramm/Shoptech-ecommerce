import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LiveConversation, LiveConversationDocument } from './schemas/live-conversation.schema';
import { LiveMessage, LiveMessageDocument } from './schemas/live-message.schema';

@Injectable()
export class LiveChatService {
  constructor(
    @InjectModel(LiveConversation.name) private liveConversationModel: Model<LiveConversationDocument>,
    @InjectModel(LiveMessage.name) private liveMessageModel: Model<LiveMessageDocument>,
  ) {}

  // 1. Get or create conversation for user/guest
  async getOrCreateConversation(data: {
    userId?: string;
    guestId?: string;
    customerName?: string;
  }): Promise<LiveConversationDocument> {
    let conversation;

    if (data.userId) {
      conversation = await this.liveConversationModel.findOne({
        userId: new Types.ObjectId(data.userId),
        status: 'active',
      });
    } else if (data.guestId) {
      conversation = await this.liveConversationModel.findOne({
        guestId: data.guestId,
        status: 'active',
      });
    }

    if (!conversation) {
      conversation = new this.liveConversationModel({
        userId: data.userId ? new Types.ObjectId(data.userId) : null,
        guestId: data.guestId || null,
        customerName: data.customerName || 'Khách hàng',
        status: 'active',
      });
      await conversation.save();
    }

    return conversation;
  }

  // 2. Save a new message
  async saveMessage(data: {
    conversationId: string;
    senderRole: string; // 'user' | 'admin' | 'guest'
    senderId?: string;
    content: string;
  }): Promise<LiveMessageDocument> {
    const message = new this.liveMessageModel({
      conversationId: new Types.ObjectId(data.conversationId),
      senderRole: data.senderRole,
      senderId: data.senderId ? new Types.ObjectId(data.senderId) : null,
      content: data.content,
    });

    await message.save();

    // Update last message in conversation
    await this.liveConversationModel.findByIdAndUpdate(data.conversationId, {
      lastMessage: data.content,
    });

    return message;
  }

  // 3. Get chat history for a conversation
  async getChatHistory(conversationId: string): Promise<LiveMessageDocument[]> {
    return this.liveMessageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  // 4. Admin: Get all active conversations
  async getActiveConversations(): Promise<LiveConversationDocument[]> {
    return this.liveConversationModel
      .find({ status: 'active' })
      .sort({ updatedAt: -1 })
      .populate('userId', 'fullName avatar') // populate user info if logged in
      .exec();
  }
}
