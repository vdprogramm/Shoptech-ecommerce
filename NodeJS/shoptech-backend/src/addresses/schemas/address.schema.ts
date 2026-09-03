import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Address extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true })
  receiverName: string; // Tên người nhận (Có thể khác tên người mua)

  @Prop({ required: true })
  phone: string; // Số điện thoại người nhận

  @Prop({ required: true })
  street: string; // Số nhà, tên đường

  @Prop({ required: true })
  ward: string; // Phường/Xã

  @Prop({ required: true })
  district: string; // Quận/Huyện

  @Prop({ required: true })
  province: string; // Tỉnh/Thành phố

  @Prop({ default: false })
  isDefault: boolean; // Có phải địa chỉ mặc định không?
}

export const AddressSchema = SchemaFactory.createForClass(Address);