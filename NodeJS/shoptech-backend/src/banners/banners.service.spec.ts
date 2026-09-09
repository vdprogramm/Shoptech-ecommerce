import { Test, TestingModule } from '@nestjs/testing';
import { BannersService } from './banners.service';
import { getModelToken } from '@nestjs/mongoose';
import { Banner } from './schemas/banner.schema';

describe('BannersService', () => {
  let service: BannersService;
  let mockBannerModel: any;
  let bannerModelConstructor: any;

  beforeEach(async () => {
    mockBannerModel = {
      create: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    bannerModelConstructor = jest.fn();
    bannerModelConstructor.create = mockBannerModel.create;
    bannerModelConstructor.find = mockBannerModel.find;
    bannerModelConstructor.findByIdAndUpdate = mockBannerModel.findByIdAndUpdate;
    bannerModelConstructor.findByIdAndDelete = mockBannerModel.findByIdAndDelete;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        {
          provide: getModelToken(Banner.name),
          useValue: bannerModelConstructor,
        },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('thành công', async () => {
      mockBannerModel.create.mockResolvedValue({ _id: 'banner1' });
      const result = await service.create({});
      expect(result._id).toBe('banner1');
    });
  });

  describe('getActiveBanners', () => {
    it('chỉ lấy banner active', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      mockBannerModel.find.mockReturnValue({ exec: mockExec });

      await service.getActiveBanners();
      expect(mockBannerModel.find).toHaveBeenCalledWith({ isActive: true });
    });

    it('lấy banner theo vị trí', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      mockBannerModel.find.mockReturnValue({ exec: mockExec });

      await service.getActiveBanners('HOME');
      expect(mockBannerModel.find).toHaveBeenCalledWith({ isActive: true, position: 'HOME' });
    });
  });

  describe('toggleActive', () => {
    it('cập nhật thành công', async () => {
      mockBannerModel.findByIdAndUpdate.mockResolvedValue({ _id: 'b1', isActive: true });
      const result = await service.toggleActive('b1', true);
      expect(mockBannerModel.findByIdAndUpdate).toHaveBeenCalledWith('b1', { isActive: true }, { new: true });
      expect(result.isActive).toBe(true);
    });
  });

  describe('findAll', () => {
    it('lấy toàn bộ và sort', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockBannerModel.find.mockReturnValue({ sort: mockSort });

      await service.findAll();
      expect(mockBannerModel.find).toHaveBeenCalled();
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('update', () => {
    it('update thành công', async () => {
      const mockExec = jest.fn().mockResolvedValue({ _id: 'b1' });
      mockBannerModel.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

      const result = await service.update('b1', { name: 'New' });
      expect(mockBannerModel.findByIdAndUpdate).toHaveBeenCalledWith('b1', { name: 'New' }, { new: true });
      expect(result._id).toBe('b1');
    });
  });

  describe('remove', () => {
    it('xóa thành công', async () => {
      const mockExec = jest.fn().mockResolvedValue({ _id: 'b1' });
      mockBannerModel.findByIdAndDelete.mockReturnValue({ exec: mockExec });

      const result = await service.remove('b1');
      expect(mockBannerModel.findByIdAndDelete).toHaveBeenCalledWith('b1');
      expect(result._id).toBe('b1');
    });
  });
});
