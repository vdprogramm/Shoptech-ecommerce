import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Banner extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  imageUrl: string; // Link ảnh upload

  @Prop()
  targetLink: string; // Bấm vào ảnh thì chuyển hướng đi đâu (VD: /category/apple)

  @Prop({ default: 'TopSlider', enum: ['TopSlider', 'Sidebar', 'Popup'] })
  position: string; // Vị trí đặt banner

  @Prop({ default: true })
  isActive: boolean; // Công tắc Bật/Tắt banner thủ công
}

export const BannerSchema = SchemaFactory.createForClass(Banner);