import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true })
  product: mongoose.Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number; // Số sao từ 1 đến 5

  @Prop()
  comment: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true })
  store: mongoose.Types.ObjectId;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);