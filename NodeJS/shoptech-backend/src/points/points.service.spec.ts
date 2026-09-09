import { Test, TestingModule } from '@nestjs/testing';
import { PointsService } from './points.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { PointTransaction } from './schemas/point-transaction.schema';
import { Order } from '../orders/schemas/order.schema';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('PointsService', () => {
  let service: PointsService;
  let mockUserModel: any;
  let mockTxModel: any;
  let mockOrderModel: any;

  const validUserId = new Types.ObjectId().toHexString();
  const validOrderId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    mockUserModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: validUserId, loyaltyPoints: 100 }),
      }),
      findByIdAndUpdate: jest.fn().mockResolvedValue(true),
    };

    mockTxModel = {
      create: jest.fn().mockResolvedValue(true),
    };

    mockOrderModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            user: validUserId,
            subOrders: [
              { _id: new Types.ObjectId(), status: 'Delivered', grandTotal: 200000 },
              { _id: new Types.ObjectId(), status: 'Pending', grandTotal: 100000 },
            ]
          }
        ])
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(PointTransaction.name), useValue: mockTxModel },
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPoints', () => {
    it('should return user points', async () => {
      const result = await service.getUserPoints(validUserId);
      expect(result.points).toBe(100);
    });

    it('should return 0 if user not found or no points', async () => {
      mockUserModel.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null)
      });
      const result = await service.getUserPoints(validUserId);
      expect(result.points).toBe(0);
    });
  });

  describe('rewardPointsForOrder', () => {
    it('should not add points if total is less than 100k', async () => {
      await service.rewardPointsForOrder(validUserId, validOrderId, 50000);
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockTxModel.create).not.toHaveBeenCalled();
    });

    it('should add points and create transaction if total >= 100k', async () => {
      await service.rewardPointsForOrder(validUserId, validOrderId, 250000);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(validUserId, {
        $inc: { loyaltyPoints: 2 },
      });
      expect(mockTxModel.create).toHaveBeenCalled();
    });
  });

  describe('redeemPoints', () => {
    it('should throw BadRequestException if user not found or insufficient points', async () => {
      mockUserModel.findById.mockResolvedValueOnce({ loyaltyPoints: 50 });
      await expect(service.redeemPoints(validUserId, 100, validOrderId)).rejects.toThrow(BadRequestException);
    });

    it('should deduct points and create transaction', async () => {
      const user = { loyaltyPoints: 150, save: jest.fn().mockResolvedValue(true) };
      mockUserModel.findById.mockResolvedValueOnce(user);

      await service.redeemPoints(validUserId, 100, validOrderId);
      
      expect(user.loyaltyPoints).toBe(50);
      expect(user.save).toHaveBeenCalled();
      expect(mockTxModel.create).toHaveBeenCalled();
    });
  });

  describe('rewardPointsForOldOrders', () => {
    it('should process old delivered orders and reward points', async () => {
      // Spy on rewardPointsForOrder to check if it's called internally
      jest.spyOn(service, 'rewardPointsForOrder').mockResolvedValue(undefined);
      
      const result = await service.rewardPointsForOldOrders();
      
      expect(result.message).toContain('thành công cho 1 đơn hàng cũ');
      expect(service.rewardPointsForOrder).toHaveBeenCalledTimes(1); // 1 delivered subOrder
    });
  });
});
