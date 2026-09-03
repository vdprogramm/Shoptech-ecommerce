import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ProductVariant extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true })
  product: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true })
    store: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  sku: string; // Mã lưu kho nội bộ (VD: IPHONE16-128-RED)

  @Prop({ type: Map, of: String, required: true })
  attributes: Record<string, string>; // Lưu dạng Object: { "Màu sắc": "Đỏ", "Dung lượng": "128GB" }

  @Prop({ required: true })
  price: number; // Giá bán lẻ của phiên bản này

  @Prop({ required: true, default: 0 })
  stock: number; // Tồn kho của riêng phiên bản này

  @Prop()
  imageUrl: string; // Ảnh riêng của màu này (Tùy chọn)
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);