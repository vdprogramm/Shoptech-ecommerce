import { Test, TestingModule } from '@nestjs/testing';
import { WarrantiesService } from './warranties.service';
import { getModelToken } from '@nestjs/mongoose';
import { Warranty } from './schemas/warranty.schema';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('WarrantiesService', () => {
  let service: WarrantiesService;
  let mockWarrantyModel: any;
  let mockProductModel: any;

  const validId = new Types.ObjectId().toHexString();
  const validProductId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    mockProductModel = {
      findById: jest.fn().mockResolvedValue({ _id: validProductId, store: 'store1' }),
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: validProductId }])
        })
      })
    };

    mockWarrantyModel = {
      create: jest.fn().mockImplementation((dto) => Promise.resolve({ _id: validId, ...dto })),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: validId }]),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: validId, status: 'Active' }),
      }),
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: validId }),
      }),
      db: {
        model: jest.fn().mockReturnValue(mockProductModel)
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarrantiesService,
        {
          provide: getModelToken(Warranty.name),
          useValue: mockWarrantyModel,
        },
      ],
    }).compile();

    service = module.get<WarrantiesService>(WarrantiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if product not found', async () => {
      mockProductModel.findById.mockResolvedValueOnce(null);
      await expect(service.create({
        productId: validProductId,
        userId: 'user1',
        orderId: 'order1',
        startDate: '2023-01-01',
        durationMonths: 12
      })).rejects.toThrow(NotFoundException);
    });

    it('should create a warranty successfully', async () => {
      const result = await service.create({
        productId: validProductId,
        userId: 'user1',
        orderId: 'order1',
        startDate: '2023-01-01',
        durationMonths: 12
      });

      expect(result).toBeDefined();
      expect(mockWarrantyModel.create).toHaveBeenCalled();
    });
  });

  describe('getMyWarranties', () => {
    it('should return user warranties', async () => {
      const result = await service.getMyWarranties('user1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if warranty not found', async () => {
      mockWarrantyModel.findByIdAndUpdate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null)
      });
      await expect(service.update('invalid', {})).rejects.toThrow(NotFoundException);
    });

    it('should update a warranty', async () => {
      const result = await service.update(validId, { durationMonths: 12 });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if warranty not found', async () => {
      mockWarrantyModel.findByIdAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null)
      });
      await expect(service.remove('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should remove a warranty', async () => {
      const result = await service.remove(validId);
      expect(result.message).toBe('Đã xóa bảo hành thành công');
    });
  });

  describe('findAll', () => {
    it('should return all warranties', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('getMerchantWarranties', () => {
    it('should return warranties for a merchant store', async () => {
      const result = await service.getMerchantWarranties('store1');
      expect(result).toHaveLength(1);
      expect(mockProductModel.find).toHaveBeenCalledWith({ store: 'store1' });
    });
  });
});
