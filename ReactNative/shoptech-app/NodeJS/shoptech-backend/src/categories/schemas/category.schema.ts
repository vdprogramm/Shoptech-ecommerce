import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, unique: true })
  name: string; // VD: Laptop, Điện thoại

  @Prop()
  description: string;

  @Prop()
  image: string; // Icon hoặc ảnh đại diện cho danh mục
}
export const CategorySchema = SchemaFactory.createForClass(Category);