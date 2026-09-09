import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { getModelToken } from '@nestjs/mongoose';
import { News } from './schemas/news.schema';
import { NotFoundException } from '@nestjs/common';

describe('NewsService', () => {
  let service: NewsService;
  let mockNewsModel: any;
  let newsModelConstructor: any;

  beforeEach(async () => {
    mockNewsModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    newsModelConstructor = jest.fn();
    newsModelConstructor.find = mockNewsModel.find;
    newsModelConstructor.findById = mockNewsModel.findById;
    newsModelConstructor.create = mockNewsModel.create;
    newsModelConstructor.findByIdAndUpdate = mockNewsModel.findByIdAndUpdate;
    newsModelConstructor.findByIdAndDelete = mockNewsModel.findByIdAndDelete;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: getModelToken(News.name),
          useValue: newsModelConstructor,
        },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('trả về danh sách tin tức active', async () => {
      const mockExec = jest.fn().mockResolvedValue([{ _id: 'news1' }]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockNewsModel.find.mockReturnValue({ sort: mockSort });

      const result = await service.findAll();
      expect(mockNewsModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('văng lỗi NotFoundException nếu không tìm thấy', async () => {
      mockNewsModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('trả về tin tức nếu tìm thấy', async () => {
      mockNewsModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      const result = await service.findOne('1');
      expect(result._id).toBe('1');
    });
  });

  describe('create', () => {
    it('tạo tin tức thành công', async () => {
      mockNewsModel.create.mockResolvedValue({ _id: '1' });
      const result = await service.create({});
      expect(result._id).toBe('1');
    });
  });

  describe('update', () => {
    it('văng lỗi NotFoundException nếu không tìm thấy', async () => {
      mockNewsModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
    });

    it('cập nhật tin tức thành công', async () => {
      mockNewsModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      const result = await service.update('1', {});
      expect(result._id).toBe('1');
    });
  });

  describe('remove', () => {
    it('văng lỗi NotFoundException nếu không tìm thấy', async () => {
      mockNewsModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });

    it('xóa tin tức thành công', async () => {
      mockNewsModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      const result = await service.remove('1');
      expect(result._id).toBe('1');
    });
  });
});
