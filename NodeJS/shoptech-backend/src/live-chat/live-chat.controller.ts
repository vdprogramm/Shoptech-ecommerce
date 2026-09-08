import { Controller, Get, Param, Query } from '@nestjs/common';
import { LiveChatService } from './live-chat.service';

@Controller('live-chat')
export class LiveChatController {
  constructor(private readonly liveChatService: LiveChatService) {}

  @Get('conversations')
  async getActiveConversations(@Query('storeId') storeId: string) {
    if (!storeId) {
      return { message: 'storeId is required', data: [] };
    }
    const conversations = await this.liveChatService.getConversationsForStore(storeId);
    return {
      message: 'Lấy danh sách hội thoại thành công',
      data: conversations,
    };
  }

  @Get('history/:conversationId')
  async getChatHistory(@Param('conversationId') conversationId: string) {
    const history = await this.liveChatService.getChatHistory(conversationId);
    return {
      message: 'Lấy lịch sử tin nhắn thành công',
      data: history,
    };
  }

  @Get('user-conversations')
  async getUserConversations(@Query('userId') userId: string) {
    if (!userId) {
      return { message: 'userId is required', data: [] };
    }
    const conversations = await this.liveChatService.getConversationsForUser(userId);
    return {
      message: 'Lấy danh sách hội thoại của khách hàng thành công',
      data: conversations,
    };
  }
}
