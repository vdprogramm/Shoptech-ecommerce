import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiConversation, AiConversationSchema } from './schemas/ai-conversation.schema';
import { AiMessage, AiMessageSchema } from './schemas/ai-message.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiConversation.name, schema: AiConversationSchema },
      { name: AiMessage.name, schema: AiMessageSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}