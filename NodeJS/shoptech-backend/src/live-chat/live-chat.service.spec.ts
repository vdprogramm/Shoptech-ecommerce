import { Test, TestingModule } from '@nestjs/testing';
import { LiveChatService } from './live-chat.service';
import { getModelToken } from '@nestjs/mongoose';
import { LiveConversation } from './schemas/live-conversation.schema';
import { LiveMessage } from './schemas/live-message.schema';

describe('LiveChatService', () => {
  let service: LiveChatService;
  let mockLiveConversationModel: any;
  let mockLiveMessageModel: any;
  let conversationConstructor: any;
  let messageConstructor: any;

  beforeEach(async () => {
    mockLiveConversationModel = {
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
    };

    mockLiveMessageModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };

    conversationConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: 'conv1' }),
    }));
    conversationConstructor.findOne = mockLiveConversationModel.findOne;
    conversationConstructor.findByIdAndUpdate = mockLiveConversationModel.findByIdAndUpdate;
    conversationConstructor.find = mockLiveConversationModel.find;

    messageConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: 'msg1' }),
    }));
    messageConstructor.find = mockLiveMessageModel.find;
    messageConstructor.findById = mockLiveMessageModel.findById;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveChatService,
        {
          provide: getModelToken(LiveConversation.name),
          useValue: conversationConstructor,
        },
        {
          provide: getModelToken(LiveMessage.name),
          useValue: messageConstructor,
        },
      ],
    }).compile();

    service = module.get<LiveChatService>(LiveChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateConversation', () => {
    it('trả về cuộc hội thoại user đã có', async () => {
      const mockConv = { _id: 'conv1' };
      mockLiveConversationModel.findOne.mockResolvedValue(mockConv);

      const result = await service.getOrCreateConversation({ storeId: '000000000000000000000000', userId: '111111111111111111111111' });
      expect(result).toEqual(mockConv);
    });

    it('trả về cuộc hội thoại guest đã có', async () => {
      const mockConv = { _id: 'conv1' };
      mockLiveConversationModel.findOne.mockResolvedValue(mockConv);

      const result = await service.getOrCreateConversation({ storeId: '000000000000000000000000', guestId: 'guest1' });
      expect(result).toEqual(mockConv);
    });

    it('tạo cuộc hội thoại mới nếu chưa có', async () => {
      mockLiveConversationModel.findOne.mockResolvedValue(null);
      const result = await service.getOrCreateConversation({ storeId: '000000000000000000000000', userId: '111111111111111111111111' });
      expect(result.storeId).toBeDefined();
    });
  });

  describe('saveMessage', () => {
    it('lưu tin nhắn và cập nhật lastMessage', async () => {
      const result = await service.saveMessage({
        conversationId: '000000000000000000000000',
        senderRole: 'user',
        content: 'hello',
      });
      expect(result.content).toBe('hello');
      expect(mockLiveConversationModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('getChatHistory', () => {
    it('trả về lịch sử', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      mockLiveMessageModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: mockExec }) });

      const result = await service.getChatHistory('000000000000000000000000');
      expect(result).toEqual([]);
    });
  });

  describe('getConversationsForStore', () => {
    it('trả về danh sách', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      mockLiveConversationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({ exec: mockExec }),
        }),
      });

      const result = await service.getConversationsForStore('000000000000000000000000');
      expect(result).toEqual([]);
    });
  });

  describe('getConversationsForUser', () => {
    it('trả về danh sách', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      mockLiveConversationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({ exec: mockExec }),
        }),
      });

      const result = await service.getConversationsForUser('000000000000000000000000');
      expect(result).toEqual([]);
    });
  });

  describe('revokeMessage', () => {
    it('văng lỗi nếu không tìm thấy', async () => {
      mockLiveMessageModel.findById.mockResolvedValue(null);
      await expect(service.revokeMessage('1', 'u1')).rejects.toThrow(Error);
    });

    it('văng lỗi nếu không đúng user', async () => {
      mockLiveMessageModel.findById.mockResolvedValue({ senderId: 'u2', toString: () => 'u2' });
      await expect(service.revokeMessage('1', 'u1')).rejects.toThrow(Error);
    });

    it('cập nhật thành công', async () => {
      const mockMsg = { senderId: 'u1', save: jest.fn().mockResolvedValue(true) };
      mockLiveMessageModel.findById.mockResolvedValue(mockMsg);
      await service.revokeMessage('1', 'u1');
      expect(mockMsg.save).toHaveBeenCalled();
    });
  });
});
