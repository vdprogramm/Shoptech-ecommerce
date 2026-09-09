import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { ProductVariant } from '../product-variants/schemas/product-variant.schema';
import { OrdersService } from '../orders/orders.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import mongoose from 'mongoose';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockProductModel: any;
  let mockVariantModel: any;
  const validObjectId = new mongoose.Types.ObjectId().toHexString();

  beforeEach(async () => {
    mockProductModel = {
      find: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    mockVariantModel = {
      save: jest.fn(),
      findOne: jest.fn(),
      deleteMany: jest.fn(),
    };

    // Constructor mock cho ProductModel
    const productModelConstructor: any = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: 'mockProductId',
      save: mockProductModel.save,
    }));
    productModelConstructor.find = mockProductModel.find;
    productModelConstructor.findById = mockProductModel.findById;
    productModelConstructor.findOneAndUpdate = mockProductModel.findOneAndUpdate;
    productModelConstructor.findOne = mockProductModel.findOne;
    productModelConstructor.findByIdAndUpdate = mockProductModel.findByIdAndUpdate;
    productModelConstructor.findByIdAndDelete = mockProductModel.findByIdAndDelete;

    // Constructor mock cho VariantModel
    const variantModelConstructor: any = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: 'mockVariantId',
      save: mockVariantModel.save,
    }));
    variantModelConstructor.findOne = mockVariantModel.findOne;
    variantModelConstructor.deleteMany = mockVariantModel.deleteMany;

    const mockOrdersService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: productModelConstructor,
        },
        {
          provide: getModelToken(ProductVariant.name),
          useValue: variantModelConstructor,
        },
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('trả về danh sách sản phẩm thành công', async () => {
      const mockExec = jest.fn().mockResolvedValue([{ name: 'Test Product' }]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate });
      mockProductModel.find.mockReturnValue({ populate: mockPopulate2 });

      const result = await service.findAll({});
      expect(result).toEqual([{ name: 'Test Product' }]);
      expect(mockProductModel.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('văng lỗi BadRequest nếu không có storeId', async () => {
      await expect(
        service.create({ name: 'Product', description: 'Desc', price: 100 } as any, { roles: ['USER'] })
      ).rejects.toThrow(BadRequestException);
    });

    it('văng lỗi ConflictException nếu MongoDB báo lỗi E11000 trùng SKU', async () => {
      // Giả lập lỗi trùng SKU
      mockProductModel.save.mockRejectedValue({
        code: 11000,
        keyValue: { sku: 'TRUNG-LAP-SKU' }
      });

      // Bỏ qua findOne error bằng cách mock tạm thời
      jest.spyOn(service, 'findOne').mockResolvedValue(null as any);

      await expect(
        service.create({ name: 'Product', store: 'storeId', price: 100 } as any, { storeId: 'storeId' })
      ).rejects.toThrow(ConflictException);
    });

    it('tạo sản phẩm thành công với biến thể mặc định nếu không truyền variants', async () => {
      const mockSavedProduct = { _id: 'mockProductId', name: 'Product', price: 100, save: jest.fn() };
      mockProductModel.save.mockResolvedValue(mockSavedProduct);
      
      const mockSavedVariant = { _id: 'mockVariantId' };
      mockVariantModel.save.mockResolvedValue(mockSavedVariant);

      jest.spyOn(service, 'findOne').mockResolvedValue(mockSavedProduct as any);

      const result = await service.create({ name: 'Product', price: 100 } as any, { storeId: 'storeId' });

      expect(mockProductModel.save).toHaveBeenCalled();
      expect(mockVariantModel.save).toHaveBeenCalled();
      expect(result.name).toBe('Product');
    });
  });

  describe('findOne', () => {
    it('văng lỗi BadRequest nếu ID không hợp lệ', async () => {
      await expect(service.findOne('invalid')).rejects.toThrow(BadRequestException);
    });
    
    it('văng lỗi NotFoundException nếu không tìm thấy sản phẩm', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockPopulate2 = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      mockProductModel.findById.mockReturnValue({ populate: mockPopulate });

      await expect(service.findOne(validObjectId)).rejects.toThrow(NotFoundException);
    });

    it('trả về sản phẩm thành công', async () => {
      const mockExec = jest.fn().mockResolvedValue({ _id: validObjectId, name: 'Product' });
      const mockPopulate2 = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      mockProductModel.findById.mockReturnValue({ populate: mockPopulate });

      const result = await service.findOne(validObjectId);
      expect(result).toBeDefined();
      expect(result.name).toBe('Product');
    });
  });

  describe('update', () => {
    it('văng lỗi BadRequest nếu ID không hợp lệ', async () => {
      await expect(service.update('invalid', {}, validObjectId)).rejects.toThrow(BadRequestException);
    });

    it('cập nhật thành công với variants', async () => {
      const mockExec = jest.fn().mockResolvedValue({ _id: validObjectId, save: jest.fn() });
      mockProductModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });
      mockVariantModel.deleteMany.mockResolvedValue(true);
      mockVariantModel.save.mockResolvedValue({ _id: new mongoose.Types.ObjectId().toHexString() });
      jest.spyOn(service, 'findOne').mockResolvedValue({ _id: validObjectId } as any);

      const result = await service.update(validObjectId, { name: 'Update', variants: [{}] } as any, validObjectId);
      expect(result).toBeDefined();
      expect(mockVariantModel.deleteMany).toHaveBeenCalled();
    });

    it('văng lỗi BadRequest nếu không thấy sản phẩm', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockProductModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });
      await expect(service.update(validObjectId, {}, validObjectId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('văng lỗi BadRequest nếu ID không hợp lệ', async () => {
      await expect(service.remove('invalid', validObjectId)).rejects.toThrow(BadRequestException);
    });

    it('xóa thành công', async () => {
      mockProductModel.findOne.mockResolvedValue({ _id: validObjectId });
      mockVariantModel.deleteMany.mockResolvedValue(true);
      const mockExec = jest.fn().mockResolvedValue(true);
      mockProductModel.findByIdAndDelete.mockReturnValue({ exec: mockExec });

      const result = await service.remove(validObjectId, validObjectId);
      expect(result.message).toBeDefined();
      expect(mockProductModel.findByIdAndDelete).toHaveBeenCalled();
    });
  });

  describe('updateRating', () => {
    it('trả về null nếu ID không hợp lệ', async () => {
      const result = await service.updateRating('invalid', 5, 1);
      expect(result).toBeNull();
    });

    it('cập nhật rating thành công', async () => {
      const mockExec = jest.fn().mockResolvedValue({ _id: validObjectId });
      mockProductModel.findByIdAndUpdate.mockReturnValue({ exec: mockExec });
      const result = await service.updateRating(validObjectId, 5, 1);
      expect(result).toBeDefined();
    });
  });

  describe('addStock', () => {
    it('văng lỗi BadRequest nếu ID không hợp lệ', async () => {
      await expect(service.addStock('invalid', 10, validObjectId)).rejects.toThrow(BadRequestException);
    });

    it('văng lỗi nếu số lượng <= 0', async () => {
      await expect(service.addStock(validObjectId, 0, validObjectId)).rejects.toThrow(BadRequestException);
    });

    it('nhập kho thành công', async () => {
      mockVariantModel.findOne.mockResolvedValue({ _id: validObjectId, stock: 10, save: jest.fn() });
      const result = await service.addStock(validObjectId, 5, validObjectId);
      expect(result.currentStock).toBe(15);
    });
  });

  describe('findBestSellers', () => {
    it('trả về best sellers', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulate = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      mockProductModel.find.mockReturnValue({ populate: mockPopulate });

      const result = await service.findBestSellers(10);
      expect(result).toEqual([]);
    });
  });
});
