import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ _id: false })
export class FlashSaleItem {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true })
  variant: mongoose.Types.ObjectId; // Sale bản 128GB chứ không sale bản 256GB

  @Prop({ required: true })
  salePrice: number; // Giá sốc (VD: 25.000.000đ)

  @Prop({ required: true })
  quantityLimit: number; // Chỉ cho phép bán 100 cái giá này

  @Prop({ default: 0 })
  soldCount: number; // Đã bán được bao nhiêu cái rồi
}

@Schema({ timestamps: true, collection: 'flashsales' })
export class FlashSale extends Document {
  @Prop({ required: true })
  campaignName: string; // VD: "Săn Deal Nửa Đêm"

  @Prop({ required: true })
  startTime: Date; // Giờ bắt đầu

  @Prop({ required: true })
  endTime: Date; // Giờ kết thúc

  @Prop({ type: [FlashSaleItem], default: [] })
  items: FlashSaleItem[]; // Danh sách các sản phẩm sale

  @Prop({ default: true })
  isActive: boolean;
}

export const FlashSaleSchema = SchemaFactory.createForClass(FlashSale);