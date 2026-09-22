import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import { Voucher, VoucherSchema } from './schemas/voucher.schema';

@Module({
  imports: [
    // Đăng ký VoucherSchema với Mongoose thì Service mới dùng được
    MongooseModule.forFeature([{ name: Voucher.name, schema: VoucherSchema }])
  ],
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService] // Mở public Service này để OrdersModule có thể xài ké
})
export class VouchersModule {}