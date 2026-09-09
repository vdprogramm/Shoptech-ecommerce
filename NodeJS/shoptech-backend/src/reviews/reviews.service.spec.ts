import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { getModelToken } from '@nestjs/mongoose';
import { Review } from './schemas/review.schema';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { BadRequestException } from '@nestjs/common';
import mongoose, { Types } from 'mongoose';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let mockReviewModel: any;
  let mockOrdersService: any;
  let mockProductsService: any;
  let mockUsersService: any;
  let mockMailService: any;

  const mockUserId = new Types.ObjectId().toHexString();
  const mockProductId = new Types.ObjectId().toHexString();
  const mockReviewId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    mockReviewModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn().mockResolvedValue([{ averageRating: 4.5, reviewCount: 1 }]),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: mockReviewId }])
      }),
      countDocuments: jest.fn().mockResolvedValue(1),
      deleteOne: jest.fn().mockResolvedValue(true),
    };

    mockOrdersService = {
      findAllByUser: jest.fn().mockResolvedValue([
        {
          subOrders: [
            {
              status: 'Delivered',
              items: [{ product: mockProductId }]
            }
          ]
        }
      ]),
    };

    mockProductsService = {
      findOne: jest.fn().mockResolvedValue({ _id: mockProductId, store: new Types.ObjectId(), name: 'Test Product' }),
      updateRating: jest.fn().mockResolvedValue(true),
    };

    mockUsersService = {
      findById: jest.fn().mockResolvedValue({ _id: mockUserId, email: 'test@test.com', fullName: 'Test User' }),
    };

    mockMailService = {
      sendReviewThankYouMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getModelToken(Review.name), useValue: mockReviewModel },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addReview', () => {
    it('should throw BadRequestException if user has not bought the product', async () => {
      mockOrdersService.findAllByUser.mockResolvedValueOnce([]); // No orders
      await expect(service.addReview(mockUserId, mockProductId, 5, 'Good'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already reviewed', async () => {
      mockReviewModel.findOne.mockResolvedValueOnce({ _id: mockReviewId });
      await expect(service.addReview(mockUserId, mockProductId, 5, 'Good'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if product not found or no store', async () => {
      mockReviewModel.findOne.mockResolvedValueOnce(null);
      mockProductsService.findOne.mockResolvedValueOnce(null);
      await expect(service.addReview(mockUserId, mockProductId, 5, 'Good'))
        .rejects.toThrow(BadRequestException);
    });

    it('should create review, update stats and send email', async () => {
      mockReviewModel.findOne.mockResolvedValueOnce(null);
      mockReviewModel.create.mockResolvedValueOnce({ _id: mockReviewId });
      
      const result = await service.addReview(mockUserId, mockProductId, 5, 'Good');
      
      expect(mockReviewModel.create).toHaveBeenCalled();
      expect(mockProductsService.updateRating).toHaveBeenCalledWith(mockProductId, 4.5, 1);
      expect(mockMailService.sendReviewThankYouMail).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle mail failure gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockReviewModel.findOne.mockResolvedValueOnce(null);
      mockReviewModel.create.mockResolvedValueOnce({ _id: mockReviewId });
      mockMailService.sendReviewThankYouMail.mockRejectedValueOnce(new Error('Mail error'));
      
      // Should not throw
      const result = await service.addReview(mockUserId, mockProductId, 5, 'Good');
      expect(result).toBeDefined();
      jest.restoreAllMocks();
    });

    it('should update stats to 0 if no reviews left', async () => {
      mockReviewModel.findOne.mockResolvedValueOnce(null);
      mockReviewModel.create.mockResolvedValueOnce({ _id: mockReviewId });
      mockReviewModel.aggregate.mockResolvedValueOnce([]); // No stats
      
      await service.addReview(mockUserId, mockProductId, 5, 'Good');
      
      expect(mockProductsService.updateRating).toHaveBeenCalledWith(mockProductId, 0, 0);
    });
  });

  describe('getReviewsByProduct', () => {
    it('should return reviews', async () => {
      const result = await service.getReviewsByProduct(mockProductId);
      expect(result).toHaveLength(1);
    });
  });

  describe('getReviewCount', () => {
    it('should return count', async () => {
      const result = await service.getReviewCount(mockProductId);
      expect(result).toBe(1);
    });
  });

  describe('updateReview', () => {
    it('should throw BadRequestException if not found', async () => {
      mockReviewModel.findOne.mockResolvedValueOnce(null);
      await expect(service.updateReview(mockReviewId, mockUserId, 4, 'Updated'))
        .rejects.toThrow(BadRequestException);
    });

    it('should update review and product stats', async () => {
      const review = { _id: mockReviewId, product: mockProductId, save: jest.fn().mockResolvedValue(true) };
      mockReviewModel.findOne.mockResolvedValueOnce(review);
      
      const result = await service.updateReview(mockReviewId, mockUserId, 4, 'Updated');
      
      expect(review.save).toHaveBeenCalled();
      expect(mockProductsService.updateRating).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('deleteReview', () => {
    it('should throw BadRequestException if not found', async () => {
      mockReviewModel.findOne.mockResolvedValueOnce(null);
      await expect(service.deleteReview(mockReviewId, mockUserId))
        .rejects.toThrow(BadRequestException);
    });

    it('should delete review and update product stats', async () => {
      const review = { _id: mockReviewId, product: mockProductId };
      mockReviewModel.findOne.mockResolvedValueOnce(review);
      
      const result = await service.deleteReview(mockReviewId, mockUserId);
      
      expect(mockReviewModel.deleteOne).toHaveBeenCalled();
      expect(mockProductsService.updateRating).toHaveBeenCalled();
      expect(result.message).toBe('Đã xóa đánh giá thành công');
    });
  });

  describe('getAllReviewsForAdmin', () => {
    it('should return all reviews', async () => {
      const result = await service.getAllReviewsForAdmin();
      expect(result).toHaveLength(1);
    });
  });
});
