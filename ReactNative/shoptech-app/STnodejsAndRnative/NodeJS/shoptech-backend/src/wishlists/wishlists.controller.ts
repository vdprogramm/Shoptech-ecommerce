import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // Bảo vệ toàn bộ route bằng Token
@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  // KHÁCH LẤY DANH SÁCH ĐÃ THẢ TIM
  @Get()
  getMyWishlist(@Request() req) {
    return this.wishlistsService.getMyWishlist(req.user.userId);
  }

  // KHÁCH BẤM NÚT TRÁI TIM TRÊN SẢN PHẨM
  @Post(':productId/toggle')
  toggle(@Request() req, @Param('productId') productId: string) {
    return this.wishlistsService.toggleWishlist(req.user.userId, productId);
  }

  @Get('check/:productId')
  async checkIsLiked(@Request() req, @Param('productId') productId: string) {
    const isLiked = await this.wishlistsService.checkIsLiked(req.user.userId, productId);
    return { isLiked };
  }
}