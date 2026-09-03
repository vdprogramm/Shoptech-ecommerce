import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Voucher extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string; // Ví dụ: FPT500K, TET2024

  @Prop({ required: true })
  discountAmount: number; // Số tiền giảm (VD: 50000)

  @Prop({ default: 'fixed', enum: ['fixed', 'percent'] })
  discountType: string; // 'fixed' (giảm tiền mặt) hoặc 'percent' (giảm theo %)

  @Prop({ default: 0 })
  minOrderValue: number; // Đơn hàng tối thiểu để được áp dụng (VD: 5.000.000đ)

  @Prop({ required: true })
  expirationDate: Date; // Ngày hết hạn

  @Prop({ required: true, default: 100 })
  usageLimit: number; // Tổng số lượt được phép nhập mã này

  @Prop({ default: 0 })
  usedCount: number; // Số lượt đã có người dùng thực tế

  @Prop({ default: true })
  isActive: boolean; // Trạng thái Bật/Tắt mã thủ công của Admin

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Store' })
  store?: mongoose.Schema.Types.ObjectId; // Gian hàng tạo voucher (nếu là null/undefined thì voucher là của sàn)
}

export const VoucherSchema = SchemaFactory.createForClass(Voucher);