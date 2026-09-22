import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlashSalesService } from './flash-sales.service';
import { FlashSalesController } from './flash-sales.controller';
import { FlashSale, FlashSaleSchema } from './schemas/flash-sale.schema';

@Module({
  imports: [
    // Đăng ký Schema với Mongoose
    MongooseModule.forFeature([{ name: FlashSale.name, schema: FlashSaleSchema }])
  ],
  controllers: [FlashSalesController],
  providers: [FlashSalesService],
  exports: [FlashSalesService]
})
export class FlashSalesModule {}