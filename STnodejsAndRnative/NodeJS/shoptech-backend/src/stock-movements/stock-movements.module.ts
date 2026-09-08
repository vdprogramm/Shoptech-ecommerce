import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockMovementsService } from './stock-movements.service';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovement, StockMovementSchema } from './schemas/stock-movement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: StockMovement.name, schema: StockMovementSchema }])
  ],
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
  exports: [StockMovementsService] // Bắt buộc phải export để lát nữa nhúng vào chỗ khác
})
export class StockMovementsModule {}