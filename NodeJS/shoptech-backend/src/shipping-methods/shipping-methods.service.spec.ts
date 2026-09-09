import { Test, TestingModule } from '@nestjs/testing';
import { ShippingMethodsService } from './shipping-methods.service';
import { getModelToken } from '@nestjs/mongoose';
import { ShippingMethod } from './schemas/shipping-method.schema';
import { NotFoundException } from '@nestjs/common';

describe('ShippingMethodsService', () => {
  let service: ShippingMethodsService;
  let mockShippingModel: any;

  beforeEach(async () => {
    mockShippingModel = {
      create: jest.fn().mockResolvedValue({ _id: 'method1', name: 'Giao hàng nhanh', baseFee: 20000 }),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: 'method1', isActive: true }])
        })
      }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: 'method1', baseFee: 25000 })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingMethodsService,
        {
          provide: getModelToken(ShippingMethod.name),
          useValue: mockShippingModel,
        },
      ],
    }).compile();

    service = module.get<ShippingMethodsService>(ShippingMethodsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new shipping method', async () => {
      const data = { name: 'Giao hàng nhanh', baseFee: 20000 };
      const result = await service.create(data);
      expect(result).toBeDefined();
      expect(mockShippingModel.create).toHaveBeenCalledWith(data);
    });
  });

  describe('getActiveMethods', () => {
    it('should return active shipping methods sorted by baseFee', async () => {
      const result = await service.getActiveMethods();
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if method not found', async () => {
      mockShippingModel.findByIdAndUpdate.mockResolvedValueOnce(null);
      await expect(service.update('invalid', {})).rejects.toThrow(NotFoundException);
    });

    it('should update shipping method successfully', async () => {
      const result = await service.update('method1', { baseFee: 25000 });
      expect(result.baseFee).toBe(25000);
      expect(mockShippingModel.findByIdAndUpdate).toHaveBeenCalledWith('method1', { baseFee: 25000 }, { new: true });
    });
  });
});
