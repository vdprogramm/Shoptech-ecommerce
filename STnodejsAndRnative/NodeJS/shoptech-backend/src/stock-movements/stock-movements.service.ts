import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, MovementType } from './schemas/stock-movement.schema';

@Injectable()
export class StockMovementsService {
  constructor(@InjectModel(StockMovement.name) private movementModel: Model<StockMovement>) {}

  // Hàm này sẽ được các Module khác (Orders, ProductVariants) gọi nội bộ
  async recordMovement(variantId: string, type: MovementType, quantity: number, reason: string, userId: string) {
    const movement = new this.movementModel({
      variant: variantId,
      type,
      quantity,
      reason,
      performedBy: userId,
    });
    return movement.save();
  }

  // KẾ TOÁN/ADMIN XEM LỊCH SỬ CỦA 1 BIẾN THỂ SẢN PHẨM CỤ THỂ
  async getHistoryByVariant(variantId: string) {
    return this.movementModel
      .find({ variant: variantId })
      .populate('performedBy', 'fullName email') // Kéo tên người thực hiện ra
      .sort({ createdAt: -1 })
      .exec();
  }

  // KẾ TOÁN XEM TOÀN BỘ LỊCH SỬ HỆ THỐNG
  async getAllHistory() {
    return this.movementModel
      .find()
      .populate('variant', 'sku price')
      .populate('performedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }
}