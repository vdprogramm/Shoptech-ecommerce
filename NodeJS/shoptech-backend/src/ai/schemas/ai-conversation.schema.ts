import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AiConversationDocument = HydratedDocument<AiConversation>;

@Schema({ timestamps: true })
export class AiConversation {
  @Prop({ default: 'Cuộc tư vấn mới' })
  title: string;

  // Khớp với bảng User của bạn. Để default null nếu cho phép khách vãng lai chat.
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId;
}

export const AiConversationSchema = SchemaFactory.createForClass(AiConversation);