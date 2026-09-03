import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiConversation, AiConversationDocument } from './schemas/ai-conversation.schema';
import { AiMessage, AiMessageDocument } from './schemas/ai-message.schema';
import { Product } from '../products/schemas/product.schema';
import { ChatRequestDto } from './dto/chat-request.dto';
import axios from 'axios';

@Injectable()
export class AiService implements OnModuleInit {
  private fastapiUrl: string;

  constructor(
    @InjectModel(AiConversation.name) private readonly conversationModel: Model<AiConversationDocument>,
    @InjectModel(AiMessage.name) private readonly messageModel: Model<AiMessageDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  onModuleInit() {
    this.fastapiUrl = process.env.FASTAPI_AI_URL || 'http://localhost:8000';
  }

  async getChatResponse(chatRequestDto: ChatRequestDto, userId: string | null) {
    let { message, conversationId, history } = chatRequestDto; // 👉 Giải nén thêm history từ DTO
    const userObjectId = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;

    // 1. TẠO HOẶC CẬP NHẬT PHIÊN HỘI THOẠI
    if (!conversationId) {
      const newConversation = new this.conversationModel({
        userId: userObjectId,
        title: message.length > 25 ? message.substring(0, 25) + '...' : message,
      });
      const savedConv = await newConversation.save();
      conversationId = savedConv._id.toString();
    } else {
      if (userObjectId) {
        await this.conversationModel.updateOne(
          { _id: new Types.ObjectId(conversationId), userId: null },
          { $set: { userId: userObjectId } }
        );
      }
    }

    // 2. LƯU TIN NHẮN HIỆN TẠI VÀO DB
    await new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      sender: 'user',
      content: message,
    }).save();

    // 3. LẤY KÝ ỨC TỪ DATABASE (Chuẩn mực)
const historyMessages = await this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .exec();

    // 👉 SỬA DÒNG NÀY: Khai báo rõ đây là một mảng any[] thay vì để trống
    let pastMessages: any[] = [];

    if (historyMessages.length > 1) {
      pastMessages = historyMessages.slice(0, -1).map(msg => ({
        role: msg.sender,
        content: msg.content,
      }));
    } else if (history && history.length > 0) {
      pastMessages = history.map((msg: any) => ({
        role: msg.role || msg.sender,
        content: msg.content
      }));
    }

    let aiReplyContent = '';
    try {
      // 4. GỬI TẤT CẢ SANG CHO BỘ NÃO PYTHON XỬ LÝ
      const response = await axios.post(`${this.fastapiUrl}/api/chatbot/chat`, {
        message: message,
        current_message: message,
        store_id: "default_store",
        user_id: userId || "",
        history: pastMessages,
      });
      aiReplyContent = response.data.reply;
    } catch (error) {
      console.error('Lỗi khi kết nối đến Microservice FastAPI:', error.response?.data || error.message);
      aiReplyContent = 'Xin lỗi bạn, hệ thống tư vấn thông minh của ShopTech đang bận xử lý dữ liệu. Bạn thử lại sau nhé!';
    }

    // 5. LƯU CÂU TRẢ LỜI CỦA AI VÀO DB
    const savedAiMessage = await new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      sender: 'ai',
      content: aiReplyContent,
    }).save();

    return {
      conversationId,
      reply: savedAiMessage.content,
    };
  }

  // CÁC HÀM CŨ CỦA BẠN (GIỮ NGUYÊN 100%)
  async getProductRecommendations(targetProductId: string) {
    try {
      const allProducts = await this.productModel.find({ isAvailable: true }).populate('category brand').lean().exec();
      if (!allProducts || allProducts.length === 0) return [];

      const formattedProducts = allProducts.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category?.name || p.category?.toString() || 'Công nghệ',
        brand: p.brand?.name || p.brand?.toString() || 'Chính hãng',
        price: Number(p.price || 0)
      }));

      const response = await axios.post(`${this.fastapiUrl}/api/chatbot/recommend`, {
        target_product_id: targetProductId,
        all_products: formattedProducts,
      });

      const recommendedIds = response.data.recommended_ids;
      return this.productModel.find({ _id: { $in: recommendedIds } }).exec();
    } catch (error) {
      console.error('Lỗi hệ thống tính toán gợi ý ML:', error.message);
      return [];
    }
  }

  async getAllConversationsForAdmin(page: number = 1, limit: number = 20): Promise<{ data: any[], total: number, totalPages: number, currentPage: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.conversationModel
        .find()
        .populate('userId', 'fullName email roles name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.conversationModel.countDocuments().exec()
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async getConversationsByUser(userId: string): Promise<AiConversation[]> {
    return this.conversationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getMessagesByConversation(conversationId: string): Promise<AiMessage[]> {
    const checkConv = await this.conversationModel.findById(conversationId).exec();
    if (!checkConv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại yêu cầu.');
    }
    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .exec();
  }
}