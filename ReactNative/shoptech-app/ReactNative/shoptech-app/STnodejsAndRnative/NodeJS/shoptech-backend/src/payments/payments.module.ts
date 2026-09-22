import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module'; // Thêm dòng import này

@Module({
  imports: [OrdersModule], // QUAN TRỌNG: Nhúng OrdersModule vào đây
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}