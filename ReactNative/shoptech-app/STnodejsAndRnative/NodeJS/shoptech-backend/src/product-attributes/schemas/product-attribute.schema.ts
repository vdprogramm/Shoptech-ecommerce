import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ProductAttribute extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true })
  product: mongoose.Types.ObjectId;

  @Prop({ required: true, trim: true })
  key: string; // Tên thông số (VD: "RAM", "CPU", "Màn hình", "Card đồ họa")

  @Prop({ required: true, trim: true })
  value: string; // Giá trị (VD: "16GB", "Apple M3", "14.2 inch", "14-core GPU")
}

// Tạo Index ghép (Compound Index) để tối ưu hóa tốc độ Lọc (Filter)
export const ProductAttributeSchema = SchemaFactory.createForClass(ProductAttribute);
ProductAttributeSchema.index({ key: 1, value: 1 });