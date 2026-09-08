import {
  Controller, Get, Post, Body, UseGuards, Request, Delete, Param, Patch
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  private getUserId(req: any): string {
    return req.user._id || req.user.userId || req.user.sub || req.user.id;
  }

  @Get()
  getCart(@Request() req) {
    return this.cartsService.getCart(this.getUserId(req));
  }

  @Post('add')
  addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartsService.addToCart(this.getUserId(req), addToCartDto);
  }

  @Delete('remove/:variantId')
  removeItem(@Request() req, @Param('variantId') variantId: string) {
    return this.cartsService.removeItem(this.getUserId(req), variantId);
  }

  @Patch('update-quantity')
  updateQuantity(@Request() req, @Body() body: { variantId: string; quantity: number }) {
    return this.cartsService.updateQuantity(this.getUserId(req), body.variantId, body.quantity);
  }

}