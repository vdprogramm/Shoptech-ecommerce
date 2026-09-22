import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';
import { Banner, BannerSchema } from './schemas/banner.schema';

@Module({
  imports: [
    // Đăng ký Schema với Mongoose
    MongooseModule.forFeature([{ name: Banner.name, schema: BannerSchema }])
  ],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService] // Xuất ra ngoài nếu sau này cần dùng ở module khác
})
export class BannersModule {}