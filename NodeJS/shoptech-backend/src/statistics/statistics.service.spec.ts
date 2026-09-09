import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../orders/schemas/order.schema';
import { Product } from '../products/schemas/product.schema';
import { User } from '../users/schemas/user.schema';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let mockOrderModel: any;
  let mockProductModel: any;
  let mockUserModel: any;

  beforeEach(async () => {
    mockOrderModel = {
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };
    mockProductModel = {
      countDocuments: jest.fn(),
    };
    mockUserModel = {
      countDocuments: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGeneralStats', () => {
    it('trả về thống kê chung', async () => {
      mockOrderModel.countDocuments.mockResolvedValue(10);
      mockOrderModel.aggregate.mockResolvedValue([{ total: 1000 }]);
      mockProductModel.countDocuments.mockResolvedValue(20);
      mockUserModel.countDocuments.mockResolvedValue(30);

      const result = await service.getGeneralStats();
      expect(result).toEqual({ totalOrders: 10, totalRevenue: 1000, totalProducts: 20, totalUsers: 30 });
    });
  });

  describe('getRevenueByMonth', () => {
    it('trả về doanh thu theo tháng', async () => {
      mockOrderModel.aggregate.mockResolvedValue([{ _id: 1, monthlyRevenue: 1000 }]);
      const result = await service.getRevenueByMonth(2023);
      expect(result).toHaveLength(1);
    });
  });

  describe('getTopSellingProducts', () => {
    it('trả về top bán chạy', async () => {
      mockOrderModel.aggregate.mockResolvedValue([{ _id: 'prod1', totalSold: 10 }]);
      const result = await service.getTopSellingProducts();
      expect(result).toHaveLength(1);
    });
  });

  describe('getShipperStatsToday', () => {
    it('trả về thống kê shipper', async () => {
      mockOrderModel.aggregate.mockResolvedValue([{ todayOrdersCount: 5, todayRevenue: 500 }]);
      mockUserModel.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ walletBalance: 200 }) }) });

      const result = await service.getShipperStatsToday('000000000000000000000000');
      expect(result.todayOrders).toBe(5);
      expect(result.todayRevenue).toBe(500);
      expect(result.walletBalance).toBe(200);
    });
  });

  describe('getMerchantStats', () => {
    it('trả về thống kê cho merchant', async () => {
      mockOrderModel.aggregate.mockResolvedValueOnce([{ count: 15 }]).mockResolvedValueOnce([{ total: 1500 }]);
      mockProductModel.countDocuments.mockResolvedValue(5);

      const result = await service.getMerchantStats('000000000000000000000000');
      expect(result).toEqual({ totalOrders: 15, totalRevenue: 1500, totalProducts: 5 });
    });
  });

  describe('getMerchantRevenueByMonth', () => {
    it('trả về doanh thu tháng của merchant', async () => {
      mockOrderModel.aggregate.mockResolvedValue([{ _id: 1, monthlyRevenue: 500 }]);
      const result = await service.getMerchantRevenueByMonth('000000000000000000000000', 2023);
      expect(result).toHaveLength(1);
    });
  });

  describe('getMerchantTopSellingProducts', () => {
    it('trả về top sp của merchant', async () => {
      mockOrderModel.aggregate.mockResolvedValue([{ _id: 'prod2', totalSold: 5 }]);
      const result = await service.getMerchantTopSellingProducts('000000000000000000000000');
      expect(result).toHaveLength(1);
    });
  });
});
