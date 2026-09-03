import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AiMessageDocument = HydratedDocument<AiMessage>;

@Schema({ timestamps: true })
export class AiMessage {
  // Liên kết với phiên hội thoại ở trên
  @Prop({ type: Types.ObjectId, ref: 'AiConversation', required: true, index: true })
  conversationId: Types.ObjectId;

  // Xác định ai nói câu này: 'user' (khách hàng) hoặc 'ai' (bot trả lời)
  @Prop({ required: true, enum: ['user', 'ai'] })
  sender: 'user' | 'ai';

  @Prop({ required: true, trim: true })
  content: string;
}

export const AiMessageSchema = SchemaFactory.createForClass(AiMessage);