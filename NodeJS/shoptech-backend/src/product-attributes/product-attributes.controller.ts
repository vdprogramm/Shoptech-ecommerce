import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { ProductAttributesService } from './product-attributes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@Controller('product-attributes')
export class ProductAttributesController {
  constructor(private readonly attributesService: ProductAttributesService) {}

  // KHÁCH VÃNG LAI XEM THÔNG SỐ KỸ THUẬT
  @Get('product/:productId')
  getSpecs(@Param('productId') productId: string) {
    return this.attributesService.getAttributesByProduct(productId);
  }

  // ADMIN THÊM/SỬA BỘ THÔNG SỐ CHO SẢN PHẨM
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Post(':productId')
  upsertSpecs(
    @Param('productId') productId: string,
    @Body('attributes') attributes: { key: string; value: string }[],
  ) {
    return this.attributesService.upsertAttributes(productId, attributes);
  }

  @Delete(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteSpecs(@Param('productId') productId: string) {
    return this.attributesService.deleteAttributes(productId);
  }
}