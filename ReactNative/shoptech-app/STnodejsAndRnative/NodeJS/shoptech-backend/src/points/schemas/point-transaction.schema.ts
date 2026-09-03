import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PointTransaction extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Số điểm thay đổi (Dương: cộng, Âm: trừ)

  @Prop({ required: true, enum: ['EARN', 'REDEEM', 'REFUND'] })
  type: string; // EARN: Nhận, REDEEM: Sử dụng, REFUND: Hoàn điểm

  @Prop()
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order' })
  order: mongoose.Types.ObjectId;
}

export const PointTransactionSchema = SchemaFactory.createForClass(PointTransaction);