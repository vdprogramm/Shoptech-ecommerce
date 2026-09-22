import { Controller, Get, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notiService: NotificationsService) {}

  @Get()
  getHistory(@Req() req: any) {
    const userId = req.user?.userId || req.user?._id;
    return this.notiService.getMyNotifications(userId);
  }

  @Patch(':id/read')
  read(@Param('id') id: string) {
    return this.notiService.markAsRead(id);
  }

  @Get('me')
  async getMyNotifications(@Req() req: any) {
    const userId = req.user?.userId || req.user?._id;
    return this.notiService.getMyNotifications(userId);
  }
}