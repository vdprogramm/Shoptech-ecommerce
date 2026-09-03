import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  // 🎯 ĐÃ CHUYỂN LÊN ĐÂY: API lấy danh sách sản phẩm bán chạy nhất
  @Get('best-sellers')
  findBestSellers(@Query('limit') limit: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.productsService.findBestSellers(parsedLimit);
  }

  // 🔍 CHỈ GIỮ LẠI 1 HÀM: Xem chi tiết 1 sản phẩm cụ thể
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // 🖼️ API LẤY TRỰC TIẾP ẢNH SẢN PHẨM (Xử lý Base64 thành file ảnh thực)
  @Get(':id/image')
  async getProductImage(@Param('id') id: string, @Res() res: any) {
    try {
      const product = await this.productsService.findOne(id);
      const rawImage = product?.images?.[0];
      if (rawImage && rawImage.startsWith('data:image/')) {
         const [header, data] = rawImage.split(',');
         const mimeType = header.split(':')[1].split(';')[0];
         const buffer = Buffer.from(data, 'base64');
         res.setHeader('Content-Type', mimeType);
         return res.send(buffer);
      } else if (rawImage && rawImage.startsWith('http')) {
         return res.redirect(rawImage);
      }
      return res.redirect('https://placehold.co/400x400?text=No+Image');
    } catch (error) {
      return res.redirect('https://placehold.co/400x400?text=Error');
    }
  }

  @Get('merchant/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_OWNER, Role.STORE_STAFF, 'ADMIN' as any)
  async getMerchantProducts(@GetUser() user: any) {
    const storeId = user.storeId || user.store;
    if (!storeId && user.roles?.includes('ADMIN')) {
      return this.productsService.findAll({});
    }
    return this.productsService.findAllByStore(storeId);
  }

  @Post('merchant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_OWNER, Role.STORE_STAFF, 'ADMIN' as any)
  async createProductByMerchant(@Body() createProductDto: CreateProductDto, @GetUser() user: any) {
    console.log("=== [DEBUG] OBJECT USER TỪ DECORATOR ===", user);
    return this.productsService.create(createProductDto, user);
  }

  @Patch('merchant/:id/add-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_OWNER, Role.STORE_STAFF, 'ADMIN' as any)
  async addStock(
    @Param('id') variantId: string,
    @Body('quantity') quantity: number,
    @GetUser() user: any
  ) {
    let storeId = user.storeId || user.store;
    return this.productsService.addStock(variantId, Number(quantity), storeId);
  }

  @Patch('merchant/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_OWNER, Role.STORE_STAFF, 'ADMIN' as any)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: any
  ) {
    let storeId = user.storeId || user.store;

    if (user.roles?.includes('ADMIN') || !storeId) {
      storeId = updateProductDto.store;
    }

    return this.productsService.update(id, updateProductDto, storeId);
  }

  @Delete('merchant/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_OWNER, 'ADMIN' as any)
  async remove(@Param('id') id: string, @GetUser() user: any) {
    let storeId = user.storeId || user.store;

    if (user.roles?.includes('ADMIN')) {
      const product = await this.productsService.findOne(id);
      storeId = product?.store as any;
    }

    return this.productsService.remove(id, storeId);
  }
}