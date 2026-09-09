import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { getModelToken } from '@nestjs/mongoose';
import { AiConversation } from './schemas/ai-conversation.schema';
import { AiMessage } from './schemas/ai-message.schema';
import { Product } from '../products/schemas/product.schema';
import axios from 'axios';

jest.mock('axios');

describe('AiService', () => {
  let service: AiService;
  let mockConversationModel: any;
  let mockMessageModel: any;
  let mockProductModel: any;
  let convConstructor: any;
  let msgConstructor: any;

  beforeEach(async () => {
    mockConversationModel = {
      updateOne: jest.fn(),
    };

    mockMessageModel = {
      find: jest.fn(),
    };

    mockProductModel = {};

    convConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: '000000000000000000000001' }),
    }));
    convConstructor.updateOne = mockConversationModel.updateOne;

    msgConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: 'msg1' }),
    }));
    msgConstructor.find = mockMessageModel.find;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: getModelToken(AiConversation.name),
          useValue: convConstructor,
        },
        {
          provide: getModelToken(AiMessage.name),
          useValue: msgConstructor,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChatResponse', () => {
    it('tạo hội thoại mới và trả về câu trả lời của AI', async () => {
      const mockExec = jest.fn().mockResolvedValue([{ sender: 'user', content: 'hello' }]);
      mockMessageModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: mockExec }) });
      
      (axios.post as jest.Mock).mockResolvedValue({ data: { reply: 'AI response' } });

      const result = await service.getChatResponse({ message: 'hello', history: [] }, null);
      
      expect(result.conversationId).toBe('000000000000000000000001');
      expect(result.reply).toBe('AI response');
      expect(axios.post).toHaveBeenCalled();
    });

    it('sử dụng hội thoại cũ và trả về câu trả lời của AI khi có lỗi axios', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      mockMessageModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: mockExec }) });
      
      (axios.post as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const result = await service.getChatResponse({ message: 'hello', conversationId: '000000000000000000000000' }, '111111111111111111111111');
      
      expect(result.reply).toContain('hệ thống tư vấn thông minh của ShopTech đang bận');
      expect(mockConversationModel.updateOne).toHaveBeenCalled();
    });
  });
});
