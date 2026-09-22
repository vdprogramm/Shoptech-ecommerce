import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StoreDocument = HydratedDocument<Store>;

@Schema({ timestamps: true })
export class Store {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  phone: string;

  @Prop()
  logoUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  // Liên kết với bảng Users (Người quản lý cửa hàng có role là STORE)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  managerId: Types.ObjectId;
}

export const StoreSchema = SchemaFactory.createForClass(Store);