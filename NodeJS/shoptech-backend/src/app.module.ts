import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config'; // BỔ SUNG: Import ConfigModule
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { ProductsModule } from './products/products.module';
import { FilesModule } from './files/files.module';
import { CartsModule } from './carts/carts.module';
import { MailModule } from './mail/mail.module';
import { OrdersModule } from './orders/orders.module'; // BỔ SUNG: Import OrdersModule
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StatisticsModule } from './statistics/statistics.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AddressesModule } from './addresses/addresses.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { ProductAttributesModule } from './product-attributes/product-attributes.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { BannersModule } from './banners/banners.module';
import { FlashSalesModule } from './flash-sales/flash-sales.module';
import { ShippingMethodsModule } from './shipping-methods/shipping-methods.module';
import { AiModule } from './ai/ai.module';
import { StoresModule } from './stores/stores.module';
import { NewsModule } from './news/news.module';
import { VietqrModule } from './vietqr/vietqr.module';
import { WarrantiesModule } from './warranties/warranties.module';
import { PointsModule } from './points/points.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shoptech'),
    ServeStaticModule.forRoot({
          rootPath: join(__dirname, '..', 'uploads'),
          serveRoot: '/uploads', // Đường dẫn truy cập trên web/app
        }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    FilesModule,
    CartsModule,
    MailModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    StatisticsModule,
    VouchersModule,
    NotificationsModule,
    AddressesModule,
    ProductVariantsModule,
    StockMovementsModule,
    ProductAttributesModule,
    WishlistsModule,
    BannersModule,
    FlashSalesModule,
    ShippingMethodsModule,
    AiModule,
    StoresModule,
    NewsModule,
    VietqrModule,
    WarrantiesModule,
    PointsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}