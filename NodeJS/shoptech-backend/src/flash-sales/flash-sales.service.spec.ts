import { Test, TestingModule } from '@nestjs/testing';
import { FlashSalesService } from './flash-sales.service';
import { getModelToken } from '@nestjs/mongoose';
import { FlashSale } from './schemas/flash-sale.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FlashSalesService', () => {
  let service: FlashSalesService;
  let mockFlashSaleModel: any;

  beforeEach(async () => {
    mockFlashSaleModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashSalesService,
        {
          provide: getModelToken(FlashSale.name),
          useValue: mockFlashSaleModel,
        },
      ],
    }).compile();

    service = module.get<FlashSalesService>(FlashSalesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCampaign', () => {
    it('should throw BadRequestException if startTime >= endTime', async () => {
      await expect(
        service.createCampaign({ startTime: '2023-01-02', endTime: '2023-01-01' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create campaign successfully', async () => {
      mockFlashSaleModel.create.mockResolvedValue({ _id: '1' });
      const result = await service.createCampaign({ startTime: '2023-01-01', endTime: '2023-01-02' });
      expect(result).toEqual({ _id: '1' });
    });
  });

  describe('getCurrentActiveSale', () => {
    it('should return active sale', async () => {
      mockFlashSaleModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: 'sale1' }),
        }),
      });
      const result = await service.getCurrentActiveSale();
      expect(result).toEqual({ _id: 'sale1' });
    });
  });

  describe('updateFlashSaleStockAfterOrder', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockFlashSaleModel.findById.mockResolvedValue(null);
      await expect(service.updateFlashSaleStockAfterOrder('cid', 'vid', 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if item not in sale', async () => {
      mockFlashSaleModel.findById.mockResolvedValue({ items: [] });
      await expect(service.updateFlashSaleStockAfterOrder('cid', 'vid', 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if limit exceeded', async () => {
      mockFlashSaleModel.findById.mockResolvedValue({
        items: [{ variant: { toString: () => 'vid' }, soldCount: 9, quantityLimit: 10 }],
      });
      await expect(service.updateFlashSaleStockAfterOrder('cid', 'vid', 2)).rejects.toThrow(BadRequestException);
    });

    it('should update stock successfully', async () => {
      const mockSave = jest.fn();
      mockFlashSaleModel.findById.mockResolvedValue({
        items: [{ variant: { toString: () => 'vid' }, soldCount: 5, quantityLimit: 10 }],
        save: mockSave,
      });
      const result = await service.updateFlashSaleStockAfterOrder('cid', 'vid', 2);
      expect(result).toEqual({ success: true, currentSoldCount: 7 });
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all campaigns with active status mapped', async () => {
      const mockCampaign = {
        toObject: () => ({ _id: '1', isActive: true, startTime: new Date(Date.now() - 10000), endTime: new Date(Date.now() + 10000) }),
        isActive: true,
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(Date.now() + 10000),
      };
      
      mockFlashSaleModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockCampaign]),
          }),
        }),
      });

      const result = await service.findAll();
      expect(result[0].isActive).toBe(true);
    });
  });

  describe('getFlashSaleByProductId', () => {
    it('should return empty if no active campaign', async () => {
      mockFlashSaleModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      const result = await service.getFlashSaleByProductId('pid');
      expect(result.isFlashSale).toBe(false);
    });

    it('should return empty if product not in active campaign', async () => {
      mockFlashSaleModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: 'cid', items: [] }),
        }),
      });
      const result = await service.getFlashSaleByProductId('pid');
      expect(result.isFlashSale).toBe(false);
      expect(result.campaignId).toEqual('cid');
    });

    it('should return sale items if product matches', async () => {
      const mockCampaign = {
        _id: 'cid',
        campaignName: 'Flash Sale',
        endTime: new Date(),
        items: [
          {
            variant: {
              _id: 'vid',
              product: { _id: 'pid', toString: () => 'pid' },
              price: 100
            },
            salePrice: 80,
            soldCount: 0,
            quantityLimit: 10
          }
        ]
      };
      
      mockFlashSaleModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCampaign),
        }),
      });

      const result = await service.getFlashSaleByProductId('pid');
      expect(result.isFlashSale).toBe(true);
      expect(result.campaignId).toEqual('cid');
      expect(result.saleItems).toHaveLength(1);
    });
  });

  describe('updateCampaign', () => {
    it('should throw error if not found', async () => {
      mockFlashSaleModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.updateCampaign('id', {})).rejects.toThrow('Flash sale campaign not found');
    });

    it('should update successfully', async () => {
      mockFlashSaleModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'id' }) });
      const result = await service.updateCampaign('id', {});
      expect(result).toEqual({ _id: 'id' });
    });
  });

  describe('deleteCampaign', () => {
    it('should throw error if not found', async () => {
      mockFlashSaleModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.deleteCampaign('id')).rejects.toThrow('Flash sale campaign not found');
    });

    it('should delete successfully', async () => {
      mockFlashSaleModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'id' }) });
      const result = await service.deleteCampaign('id');
      expect(result).toEqual({ message: 'Xóa chiến dịch thành công' });
    });
  });
});
