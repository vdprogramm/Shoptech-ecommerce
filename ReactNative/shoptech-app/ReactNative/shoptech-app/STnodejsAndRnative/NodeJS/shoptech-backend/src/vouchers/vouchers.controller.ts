import { Controller, Post, Body, Get, Param, UseGuards, Delete } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Post()
  createVoucher(@Body() body: any) {
    return this.vouchersService.createVoucher(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('check')
  checkVoucher(@Body() body: { code: string, orderTotal: number, storeSubtotals?: Record<string, number> }) {
    return this.vouchersService.validateVoucher(body.code, body.orderTotal, body.storeSubtotals);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Get()
  getAllVouchers() {
    return this.vouchersService.getAllVouchers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('public-list')
  getPublicVouchers() {
    // Gọi hàm xử lý lấy các mã đang kích hoạt trong Service
    return this.vouchersService.getPublicVouchers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STORE_OWNER)
    @Delete(':id')
    deleteVoucher(@Param('id') id: string) {
      return this.vouchersService.deleteVoucher(id);
    }
}