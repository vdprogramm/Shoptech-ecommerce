import { Controller, Get, UseGuards, Req, Post } from '@nestjs/common';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  async getBalance(@Req() req: any) {
    const user = req.user;
    const userId = user.userId || user._id;
    return this.pointsService.getUserPoints(userId);
  }

  @Post('migrate-old-orders')
  @UseGuards(JwtAuthGuard) // Thêm guard Admin nếu hệ thống có phân quyền Admin
  async migrateOldOrders() {
    return await this.pointsService.rewardPointsForOldOrders();
  }
}