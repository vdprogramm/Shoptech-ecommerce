import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
    store: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true })
  category: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true })
  brand: mongoose.Types.ObjectId;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' }])
    variants: string[]; // (Hoặc ProductVariant[])

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  stock: number; // Tồn kho

  @Prop([String])
  images: string[];

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: 0 })
    averageRating: number;

    @Prop({ default: 0 })
    reviewCount: number;

    @Prop({ default: 0 })
    soldCount: number; // Thêm trường đếm số lượng đã bán
}
export const ProductSchema = SchemaFactory.createForClass(Product);