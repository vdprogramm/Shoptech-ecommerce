import { Controller, Get, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('public-orders')
export class PublicOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('tracking/:code')
  async trackOrder(@Param('code') code: string) {
    return this.ordersService.findByOrderCode(code);
  }
}