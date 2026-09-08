import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './schemas/order.schema';
import { ProductVariantsModule } from '../product-variants/product-variants.module';
import { CartsModule } from '../carts/carts.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { ShippingMethodsModule } from '../shipping-methods/shipping-methods.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductsModule } from '../products/products.module';
import { PublicOrdersController } from './public-orders.controller';
import { PointsModule } from '../points/points.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    forwardRef(() => ProductsModule), // 🔴 Thêm dòng này và bọc trong forwardRef

    // Giữ nguyên tất cả các module cũ bên dưới của bạn:
    ProductVariantsModule,
    CartsModule,
    StockMovementsModule,
    ShippingMethodsModule,
    VouchersModule,
    NotificationsModule,
    PointsModule,
    MailModule
  ],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}