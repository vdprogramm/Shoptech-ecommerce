import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Brand extends Document {
  @Prop({ required: true, unique: true })
  name: string; // VD: Apple, Samsung

  @Prop()
  description: string;

  @Prop()
  logo: string;
}
export const BrandSchema = SchemaFactory.createForClass(Brand);