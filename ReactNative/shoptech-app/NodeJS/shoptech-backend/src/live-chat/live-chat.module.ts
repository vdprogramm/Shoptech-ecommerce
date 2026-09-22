import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LiveConversation, LiveConversationSchema } from './schemas/live-conversation.schema';
import { LiveMessage, LiveMessageSchema } from './schemas/live-message.schema';
import { LiveChatService } from './live-chat.service';
import { LiveChatController } from './live-chat.controller';
import { LiveChatGateway } from './live-chat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LiveConversation.name, schema: LiveConversationSchema },
      { name: LiveMessage.name, schema: LiveMessageSchema },
    ]),
  ],
  controllers: [LiveChatController],
  providers: [LiveChatService, LiveChatGateway],
  exports: [LiveChatService],
})
export class LiveChatModule {}
