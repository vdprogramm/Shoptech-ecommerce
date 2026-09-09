import { Test, TestingModule } from '@nestjs/testing';
import { ProductVariantsService } from './product-variants.service';
import { getModelToken } from '@nestjs/mongoose';
import { ProductVariant } from './schemas/product-variant.schema';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ProductVariantsService', () => {
  let service: ProductVariantsService;
  let mockVariantModel: any;
  let mockStockMovementsService: any;

  beforeEach(async () => {
    mockVariantModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    mockStockMovementsService = {
      recordMovement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVariantsService,
        {
          provide: getModelToken(ProductVariant.name),
          useValue: mockVariantModel,
        },
        {
          provide: StockMovementsService,
          useValue: mockStockMovementsService,
        },
      ],
    }).compile();

    service = module.get<ProductVariantsService>(ProductVariantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVariant', () => {
    it('should throw BadRequestException if sku already exists', async () => {
      mockVariantModel.findOne.mockResolvedValue({ sku: 'TEST-SKU' });
      await expect(service.createVariant('prodId', { sku: 'TEST-SKU' })).rejects.toThrow(BadRequestException);
    });

    it('should create variant successfully', async () => {
      mockVariantModel.findOne.mockResolvedValue(null);
      mockVariantModel.create.mockResolvedValue({ sku: 'TEST-SKU', product: 'prodId' });
      const result = await service.createVariant('prodId', { sku: 'TEST-SKU' });
      expect(result).toBeDefined();
      expect(result.sku).toEqual('TEST-SKU');
    });
  });

  describe('getVariantsByProduct', () => {
    it('should return variants by product id', async () => {
      mockVariantModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ sku: 'SKU' }]) });
      const result = await service.getVariantsByProduct('prodId');
      expect(result).toHaveLength(1);
    });
  });

  describe('addVariantStock', () => {
    it('should throw NotFoundException if variant not found', async () => {
      mockVariantModel.findById.mockResolvedValue(null);
      await expect(service.addVariantStock('varId', 10, 'adminId')).rejects.toThrow(NotFoundException);
    });

    it('should add stock and record movement', async () => {
      const mockVariant = { _id: 'varId', stock: 10, save: jest.fn() };
      mockVariantModel.findById.mockResolvedValue(mockVariant);
      const result = await service.addVariantStock('varId', 5, 'adminId');
      expect(result.stock).toEqual(15);
      expect(mockVariant.save).toHaveBeenCalled();
      expect(mockStockMovementsService.recordMovement).toHaveBeenCalledWith(
        'varId',
        'IN',
        5,
        'Nhập kho thêm hàng từ Admin',
        'adminId'
      );
    });
  });

  describe('findById', () => {
    it('should return variant', async () => {
      mockVariantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ sku: 'SKU' }) });
      const result = await service.findById('varId');
      expect(result).toBeDefined();
    });
  });
});
