import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ProductVariant } from '../../product-variants/schemas/product-variant.schema'; // Nhớ import schema variant vào

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  // 🚨 CHỖ NÀY LÀ QUAN TRỌNG NHẤT: Đổi product thành variant
  @Prop([{
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    quantity: { type: Number, required: true, default: 1 }
  }])
  items: { variant: ProductVariant | string; quantity: number }[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);