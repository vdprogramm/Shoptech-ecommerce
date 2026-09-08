import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Warranty extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true })
  order: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true })
  product: mongoose.Types.ObjectId;

  @Prop({ required: true })
  startDate: Date; // Ngày bắt đầu bảo hành (ngày giao hàng)

  @Prop({ required: true })
  endDate: Date; // Ngày hết hạn bảo hành
}

export const WarrantySchema = SchemaFactory.createForClass(Warranty);