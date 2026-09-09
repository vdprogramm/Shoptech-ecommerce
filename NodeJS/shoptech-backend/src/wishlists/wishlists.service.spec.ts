import { Test, TestingModule } from '@nestjs/testing';
import { WishlistsService } from './wishlists.service';
import { getModelToken } from '@nestjs/mongoose';
import { Wishlist } from './schemas/wishlist.schema';
import { Types } from 'mongoose';

describe('WishlistsService', () => {
  let service: WishlistsService;
  let mockWishlistModel: any;

  const mockUserId = new Types.ObjectId().toHexString();
  const mockProductId = new Types.ObjectId().toHexString();
  const mockWishlistId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    mockWishlistModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: mockWishlistId }])
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistsService,
        {
          provide: getModelToken(Wishlist.name),
          useValue: mockWishlistModel,
        },
      ],
    }).compile();

    service = module.get<WishlistsService>(WishlistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toggleWishlist', () => {
    it('should remove from wishlist if already exists', async () => {
      mockWishlistModel.findOne.mockResolvedValueOnce({ _id: mockWishlistId });
      
      const result = await service.toggleWishlist(mockUserId, mockProductId);
      
      expect(mockWishlistModel.deleteOne).toHaveBeenCalledWith({ _id: mockWishlistId });
      expect(result.isLiked).toBe(false);
      expect(result.message).toBe('Đã bỏ yêu thích sản phẩm');
    });

    it('should add to wishlist if not exists', async () => {
      mockWishlistModel.findOne.mockResolvedValueOnce(null);
      
      const result = await service.toggleWishlist(mockUserId, mockProductId);
      
      expect(mockWishlistModel.create).toHaveBeenCalledWith({ user: mockUserId, product: mockProductId });
      expect(result.isLiked).toBe(true);
      expect(result.message).toBe('Đã thêm vào danh sách yêu thích');
    });
  });

  describe('getMyWishlist', () => {
    it('should return user wishlist', async () => {
      const result = await service.getMyWishlist(mockUserId);
      expect(result).toHaveLength(1);
      expect(mockWishlistModel.find).toHaveBeenCalledWith({ user: mockUserId });
    });
  });

  describe('checkIsLiked', () => {
    it('should return true if liked', async () => {
      mockWishlistModel.findOne.mockResolvedValueOnce({ _id: mockWishlistId });
      const result = await service.checkIsLiked(mockUserId, mockProductId);
      expect(result).toBe(true);
    });

    it('should return false if not liked', async () => {
      mockWishlistModel.findOne.mockResolvedValueOnce(null);
      const result = await service.checkIsLiked(mockUserId, mockProductId);
      expect(result).toBe(false);
    });
  });
});
