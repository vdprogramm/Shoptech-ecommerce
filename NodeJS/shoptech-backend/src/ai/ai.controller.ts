import { Controller, Post, Body, UseGuards, Get, Param, Req, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatRequestDto } from './dto/chat-request.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';
import * as jwt from 'jsonwebtoken';

@ApiTags('AI - Trợ lý ảo ShopTech')
@Controller('ai')
export class AiController {
  private readonly SECRET_KEY = 'DoAnShopTech_BiMat_TuyetDoi_123!@#';

  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gửi tin nhắn cho AI tư vấn sản phẩm (Hỗ trợ cả khách vãng lai & thành viên)' })
  async chat(@Body() chatRequestDto: ChatRequestDto, @Req() req: any) {
    let userId = null;

    try {
      const authHeader = req.headers['authorization'];
      console.log('--- 1. HEADER TỪ FRONTEND GỬI LÊN ---', authHeader);

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        const decoded: any = jwt.verify(token, this.SECRET_KEY);

        console.log('--- 2. NỘI DUNG TOKEN GIẢI MÃ ĐƯỢC ---', decoded);

        userId = decoded?.sub || decoded?.userId || decoded?.id || decoded?._id || null;
        console.log('--- 3. USER ID CUỐI CÙNG LÀ ---', userId);
      } else {
        console.log('---  KẾT LUẬN: FRONTEND QUÊN GỬI TOKEN ---');
      }
    } catch (err) {
      console.error('---  LỖI TẠI BACKEND: KHÔNG THỂ GIẢI MÃ ---', err.message);
      userId = null;
    }

    return this.aiService.getChatResponse(chatRequestDto, userId);
  }

  @Get('admin/conversations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lấy toàn bộ danh sách hội thoại cho Admin (Có phân trang)' })
  async getAdminConversations(
    @Query('page') page: string,
    @Query('limit') limit: string
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    return this.aiService.getAllConversationsForAdmin(pageNumber, limitNumber);
  }

  @Get('admin/conversations/:conversationId/messages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lấy chi tiết tin nhắn của một hội thoại cho Admin' })
  @ApiParam({ name: 'conversationId', description: 'ID của chuỗi hội thoại' })
  async getAdminMessages(@Param('conversationId') conversationId: string) {
    return this.aiService.getMessagesByConversation(conversationId);
  }

  @Get('conversations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách các cuộc hội thoại cũ của người dùng' })
  async getConversations(@Req() req: any) {
    let userId = null;

    try {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        const decoded: any = jwt.verify(token, this.SECRET_KEY);

        userId = decoded?.sub || decoded?.userId || decoded?.id || decoded?._id || null;
      }
    } catch (err) {
      userId = null;
    }

    if (!userId) {
      return [];
    }
    return this.aiService.getConversationsByUser(userId);
  }

  @Get('messages/:conversationId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết tin nhắn của một cuộc hội thoại' })
  @ApiParam({ name: 'conversationId', description: 'ID của chuỗi hội thoại cần lấy tin nhắn' })
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.aiService.getMessagesByConversation(conversationId);
  }
}