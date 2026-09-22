import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LiveConversationDocument = HydratedDocument<LiveConversation>;

@Schema({ timestamps: true })
export class LiveConversation {
  // If the user is logged in, link to their User ID
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId;

  // If the user is a guest, store a temporary session ID or socket ID
  @Prop({ type: String, default: null })
  guestId: string;

  // Optional: A display name for guests
  @Prop({ type: String, default: 'Khách hàng' })
  customerName: string;

  @Prop({ type: String, enum: ['active', 'closed'], default: 'active' })
  status: string;

  @Prop({ type: String, default: '' })
  lastMessage: string;

  // Cửa hàng mà khách hàng đang nhắn tin
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  storeId: Types.ObjectId;

  // Người bán (Chủ cửa hàng/nhân viên) đang trả lời tin nhắn này
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  vendorId: Types.ObjectId;
}

export const LiveConversationSchema = SchemaFactory.createForClass(LiveConversation);
