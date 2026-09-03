import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum MovementType {
  IN = 'IN',   // Nhập kho hoặc Khách hoàn trả
  OUT = 'OUT', // Xuất bán hoặc Hủy hàng lỗi
}

@Schema({ timestamps: true })
export class StockMovement extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true })
  variant: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: MovementType })
  type: MovementType;

  @Prop({ required: true, min: 1 })
  quantity: number; // Số lượng thay đổi (luôn là số dương)

  @Prop({ required: true })
  reason: string; // Lý do: "Nhập hàng đợt 1", "Bán đơn hàng #123", "Khách hủy đơn #123"

  // Ai là người thực hiện? (Có thể là Admin nhập kho, hoặc Khách hàng mua/hủy đơn)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  performedBy: mongoose.Types.ObjectId;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);