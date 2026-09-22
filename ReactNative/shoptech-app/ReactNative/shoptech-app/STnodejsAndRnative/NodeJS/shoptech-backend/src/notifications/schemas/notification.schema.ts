import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean; // Trạng thái đã đọc hay chưa

  @Prop()
  orderId: string; // Link tới đơn hàng cụ thể (nếu có)
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);