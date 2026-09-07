import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LiveMessageDocument = HydratedDocument<LiveMessage>;

@Schema({ timestamps: true })
export class LiveMessage {
  @Prop({ type: Types.ObjectId, ref: 'LiveConversation', required: true })
  conversationId: Types.ObjectId;

  // sender: 'user' | 'admin' | 'guest'
  @Prop({ type: String, required: true })
  senderRole: string;

  // If sender is logged in user or admin, link to User ID
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  senderId: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;
}

export const LiveMessageSchema = SchemaFactory.createForClass(LiveMessage);
