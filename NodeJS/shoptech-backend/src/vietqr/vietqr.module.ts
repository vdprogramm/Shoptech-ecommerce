import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VietqrService } from './vietqr.service';
import { VietqrController } from './vietqr.controller';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [VietqrController],
  providers: [VietqrService],
})
export class VietqrModule {}