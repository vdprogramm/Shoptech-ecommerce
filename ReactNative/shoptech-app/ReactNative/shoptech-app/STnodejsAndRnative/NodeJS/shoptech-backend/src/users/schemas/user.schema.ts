import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum Role {
  CUSTOMER = 'CUSTOMER',
  STORE_STAFF = 'STORE_STAFF',
    STORE_OWNER = 'STORE_OWNER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
  SHIPPER = 'SHIPPER',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ select: false })
  passwordHash?: string;

  @Prop()
  googleId?: string;

  @Prop()
  avatar?: string;

  @Prop()
  phone?: string;

  @Prop()
  gender?: string;

  @Prop()
  birthDate?: Date;

  @Prop()
  twitterId?: string;

  @Prop({ type: [String], enum: Role, default: [Role.CUSTOMER] })
  roles: Role[];

  @Prop({ default: false }) // Cập nhật: Mặc định tạo ra là chưa kích hoạt
    isActive: boolean;

    @Prop() // Lưu mã OTP
    verificationCode?: string;

    @Prop() // Thời gian hết hạn của OTP
    codeExpiredAt?: Date;

    @Prop({ type: Types.ObjectId, ref: 'Store', default: null })
      storeId: Types.ObjectId | null;

      @Prop()
      resetPasswordToken?: string;

      @Prop()
      resetPasswordExpires?: Date;

      @Prop({ default: false })
            isOnline: boolean; // Trạng thái BẬT / TẮT trực tuyến trên app

            @Prop({ default: 0 })
            walletBalance: number;

            @Prop({ default: 0 })
            loyaltyPoints: number;
}

export const UserSchema = SchemaFactory.createForClass(User);