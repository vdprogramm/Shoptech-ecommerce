import { Controller, Get, Post, Put, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { FlashSalesService } from './flash-sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@Controller('flash-sales')
export class FlashSalesController {
  constructor(private readonly flashSalesService: FlashSalesService) {}

  @Get()
  async findAll() {
    // Lấy toàn bộ chiến dịch, có thể sort theo thời gian mới nhất
    return this.flashSalesService.findAll();
  }

  // API ĐỂ FRONTEND HIỂN THỊ ĐỒNG HỒ ĐẾM NGƯỢC
  @Get('current')
  getCurrent() {
    return this.flashSalesService.getCurrentActiveSale();
  }

  // ADMIN TẠO CHƯƠNG TRÌNH MỚI
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() body: any) {
    return this.flashSalesService.createCampaign(body);
  }

  @Get('product/:id')
    async findOneByProduct(@Param('id') productId: string) {
      // Gọi sang service để tìm chiến dịch flash sale theo ID sản phẩm gốc
      return this.flashSalesService.getFlashSaleByProductId(productId);
    }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.flashSalesService.updateCampaign(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.flashSalesService.deleteCampaign(id);
  }
}