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

  // Optional: The admin who is currently handling this conversation
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  adminId: Types.ObjectId;
}

export const LiveConversationSchema = SchemaFactory.createForClass(LiveConversation);
