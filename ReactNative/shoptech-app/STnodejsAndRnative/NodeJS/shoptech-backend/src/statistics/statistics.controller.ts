import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STORE_OWNER, Role.SHIPPER)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  // Hàm phụ để lấy ID an toàn từ JWT Payload (hỗ trợ cả userId, _id hoặc sub)
  private getUserId(user: any): string {
    return user.userId || user._id || user.sub;
  }

  @Get('general')
  async getGeneral(@Req() req: any) {
    const user = req.user;
    const roles = user.roles || [user.role];

    if (roles.includes(Role.ADMIN)) {
      return this.statisticsService.getGeneralStats();
    }

    if (roles.includes(Role.SHIPPER)) {
      const shipperId = this.getUserId(user);
      return this.statisticsService.getShipperStatsToday(shipperId);
    }

    // Mặc định cho Store Owner / Merchant
    return this.statisticsService.getMerchantStats(this.getUserId(user));
  }

  @Get('shipper')
  async getShipper(@Req() req: any) {
    const user = req.user;
    const shipperId = this.getUserId(user);
    return this.statisticsService.getShipperStatsToday(shipperId);
  }

  @Get('revenue')
  getRevenue(@Query('year') year: string, @Req() req: any) {
    const user = req.user;
    const yearNum = parseInt(year, 10) || new Date().getFullYear();
    const roles = user.roles || [user.role];

    if (roles.includes(Role.ADMIN)) {
      return this.statisticsService.getRevenueByMonth(yearNum);
    }

    return this.statisticsService.getMerchantRevenueByMonth(this.getUserId(user), yearNum);
  }

  @Get('top-products')
  getTopProducts(@Req() req: any) {
    const user = req.user;
    const roles = user.roles || [user.role];

    if (roles.includes(Role.ADMIN)) {
      return this.statisticsService.getTopSellingProducts();
    }

    return this.statisticsService.getMerchantTopSellingProducts(this.getUserId(user));
  }
}