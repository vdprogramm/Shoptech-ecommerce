// src/carts/carts.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { Cart, CartSchema } from './schemas/cart.schema';

import { FlashSale, FlashSaleSchema } from '../flash-sales/schemas/flash-sale.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },

      { name: 'FlashSaleCampaign', schema: FlashSaleSchema }
    ])
  ],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}