import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ShippingMethod extends Document {
  @Prop({ required: true, unique: true })
  name: string; // VD: "Giao Hàng Nhanh", "Hỏa Tốc 2H", "Viettel Post"

  @Prop({ required: true })
  baseFee: number; // Phí giao hàng cơ bản (VD: 30000)

  @Prop({ required: true })
  estimatedDays: string; // Thời gian dự kiến (VD: "2-3 ngày", "2 giờ")

  @Prop()
  description: string; // Mô tả thêm

  @Prop({ default: true })
  isActive: boolean; // Trạng thái Bật/Tắt
}

export const ShippingMethodSchema = SchemaFactory.createForClass(ShippingMethod);