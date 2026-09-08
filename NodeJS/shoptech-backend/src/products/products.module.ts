import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductVariant, ProductVariantSchema } from '../product-variants/schemas/product-variant.schema';
import { OrdersModule } from '../orders/orders.module'; // 🔴 Thêm dòng này

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
    ]),
    forwardRef(() => OrdersModule), // 🔴 Bọc trong forwardRef để tránh lỗi vòng lặp
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}