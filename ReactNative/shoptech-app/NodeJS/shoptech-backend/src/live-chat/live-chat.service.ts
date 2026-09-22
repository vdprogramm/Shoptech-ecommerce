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

  // 1. Get or create conversation for user/guest in a specific store
  async getOrCreateConversation(data: {
    storeId: string;
    userId?: string;
    guestId?: string;
    customerName?: string;
  }): Promise<LiveConversationDocument> {
    let conversation;
    const storeObjectId = new Types.ObjectId(data.storeId);

    if (data.userId) {
      conversation = await this.liveConversationModel.findOne({
        storeId: storeObjectId,
        userId: new Types.ObjectId(data.userId),
        status: 'active',
      });
    } else if (data.guestId) {
      conversation = await this.liveConversationModel.findOne({
        storeId: storeObjectId,
        guestId: data.guestId,
        status: 'active',
      });
    }

    if (!conversation) {
      conversation = new this.liveConversationModel({
        storeId: storeObjectId,
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
    senderRole: string; // 'user' | 'vendor' | 'guest'
    senderId?: string;
    content: string;
    imageUrl?: string;
  }): Promise<LiveMessageDocument> {
    const message = new this.liveMessageModel({
      conversationId: new Types.ObjectId(data.conversationId),
      senderRole: data.senderRole,
      senderId: data.senderId ? new Types.ObjectId(data.senderId) : null,
      content: data.content,
      imageUrl: data.imageUrl || null,
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

  // 4. Vendor: Get all active conversations for a specific store
  async getConversationsForStore(storeId: string): Promise<LiveConversationDocument[]> {
    return this.liveConversationModel
      .find({ storeId: new Types.ObjectId(storeId), status: 'active' })
      .sort({ updatedAt: -1 })
      .populate('userId', 'fullName avatar') // populate user info if logged in
      .exec();
  }

  // 5. Get conversations for a specific user
  async getConversationsForUser(userId: string): Promise<LiveConversationDocument[]> {
    return this.liveConversationModel
      .find({ userId: new Types.ObjectId(userId), status: 'active' })
      .sort({ updatedAt: -1 })
      .populate('storeId', 'name logoUrl') // populate store info
      .exec();
  }

  // 6. Revoke message
  async revokeMessage(messageId: string, userId: string): Promise<LiveMessageDocument> {
    const message = await this.liveMessageModel.findById(messageId);
    if (!message) throw new Error('Message not found');
    
    // Only allow revoking if senderId matches userId
    if (message.senderId && message.senderId.toString() !== userId) {
      throw new Error('Unauthorized to revoke this message');
    }

    message.isRevoked = true;
    return message.save();
  }
}

