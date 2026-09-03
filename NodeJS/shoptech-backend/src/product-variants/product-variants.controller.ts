import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@Controller('product-variants')
export class ProductVariantsController {
  constructor(private readonly variantsService: ProductVariantsService) {}

  // KHÁCH VÃNG LAI XEM CÁC PHIÊN BẢN (VD: Chọn màu, chọn dung lượng)
  @Get('product/:productId')
  getVariants(@Param('productId') productId: string) {
    return this.variantsService.getVariantsByProduct(productId);
  }

  // ADMIN TẠO BIẾN THỂ
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':productId')
  createVariant(@Param('productId') productId: string, @Body() body: any) {
    return this.variantsService.createVariant(productId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':variantId/add-stock')
  addStock(
    @Param('variantId') variantId: string,
    @Body('quantity') quantity: number,
    @Request() req // <--- BƯỚC 1: Lấy Request để đọc Token
  ) {
    // BƯỚC 2: Truyền req.user.userId làm tham số thứ 3 (adminId)
    return this.variantsService.addVariantStock(variantId, Number(quantity), req.user.userId);
  }
}