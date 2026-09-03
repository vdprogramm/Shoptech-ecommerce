import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Wishlist extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  // Khách hàng thường thả tim Sản phẩm gốc (iPhone 16) chứ ít khi thả tim màu sắc cụ thể
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true })
  product: mongoose.Types.ObjectId;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// BÍ QUYẾT: Đánh index gộp để 1 user KHÔNG THỂ thả tim 1 sản phẩm 2 lần (gây rác DB)
WishlistSchema.index({ user: 1, product: 1 }, { unique: true });