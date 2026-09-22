import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PointTransaction, PointTransactionSchema } from './schemas/point-transaction.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PointTransaction.name, schema: PointTransactionSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService], // Export nếu cần gọi từ OrdersModule
})
export class PointsModule {}