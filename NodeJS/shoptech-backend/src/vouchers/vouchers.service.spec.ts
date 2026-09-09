import { Test, TestingModule } from '@nestjs/testing';
import { VouchersService } from './vouchers.service';
import { getModelToken } from '@nestjs/mongoose';
import { Voucher } from './schemas/voucher.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('VouchersService', () => {
  let service: VouchersService;
  let mockVoucherModel: any;

  beforeEach(async () => {
    mockVoucherModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VouchersService,
        {
          provide: getModelToken(Voucher.name),
          useValue: mockVoucherModel,
        },
      ],
    }).compile();

    service = module.get<VouchersService>(VouchersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVoucher', () => {
    it('should throw error if code exists', async () => {
      mockVoucherModel.findOne.mockResolvedValue({});
      await expect(service.createVoucher({ code: 'TEST' })).rejects.toThrow(BadRequestException);
    });

    it('should create successfully', async () => {
      mockVoucherModel.findOne.mockResolvedValue(null);
      mockVoucherModel.create.mockResolvedValue({ code: 'TEST' });
      const result = await service.createVoucher({ code: 'TEST' });
      expect(result.code).toEqual('TEST');
    });
  });

  describe('validateVoucher', () => {
    it('should throw NotFoundException if voucher not found', async () => {
      mockVoucherModel.findOne.mockResolvedValue(null);
      await expect(service.validateVoucher('TEST', 100)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if inactive', async () => {
      mockVoucherModel.findOne.mockResolvedValue({ isActive: false });
      await expect(service.validateVoucher('TEST', 100)).rejects.toThrow('Mã giảm giá đã bị vô hiệu hóa');
    });

    it('should throw BadRequestException if expired', async () => {
      mockVoucherModel.findOne.mockResolvedValue({
        isActive: true,
        expirationDate: new Date(Date.now() - 10000), // past date
      });
      await expect(service.validateVoucher('TEST', 100)).rejects.toThrow('Mã giảm giá đã hết hạn');
    });

    it('should throw BadRequestException if usage limit reached', async () => {
      mockVoucherModel.findOne.mockResolvedValue({
        isActive: true,
        expirationDate: new Date(Date.now() + 10000),
        usedCount: 10,
        usageLimit: 10,
      });
      await expect(service.validateVoucher('TEST', 100)).rejects.toThrow('Mã giảm giá đã hết lượt sử dụng');
    });

    it('should throw BadRequestException if store subtotal not met', async () => {
      mockVoucherModel.findOne.mockResolvedValue({
        isActive: true,
        expirationDate: new Date(Date.now() + 10000),
        usedCount: 0,
        usageLimit: 10,
        store: 'store1',
      });
      await expect(service.validateVoucher('TEST', 100, { store2: 100 })).rejects.toThrow('Mã giảm giá này chỉ áp dụng cho sản phẩm của gian hàng tương ứng');
    });

    it('should throw BadRequestException if min order value not met', async () => {
      mockVoucherModel.findOne.mockResolvedValue({
        isActive: true,
        expirationDate: new Date(Date.now() + 10000),
        usedCount: 0,
        usageLimit: 10,
        minOrderValue: 200,
      });
      await expect(service.validateVoucher('TEST', 100)).rejects.toThrow(BadRequestException);
    });

    it('should apply percent discount', async () => {
      mockVoucherModel.findOne.mockResolvedValue({
        _id: 'vid',
        code: 'TEST',
        isActive: true,
        expirationDate: new Date(Date.now() + 10000),
        usedCount: 0,
        usageLimit: 10,
        minOrderValue: 50,
        discountType: 'percent',
        discountAmount: 10,
      });
      const result = await service.validateVoucher('TEST', 100);
      expect(result.discountValue).toEqual(10);
      expect(result.finalTotal).toEqual(90);
    });

    it('should apply fixed discount and not exceed applicable total', async () => {
      mockVoucherModel.findOne.mockResolvedValue({
        _id: 'vid',
        code: 'TEST',
        isActive: true,
        expirationDate: new Date(Date.now() + 10000),
        usedCount: 0,
        usageLimit: 10,
        minOrderValue: 50,
        discountType: 'fixed',
        discountAmount: 150,
      });
      const result = await service.validateVoucher('TEST', 100);
      expect(result.discountValue).toEqual(100);
      expect(result.finalTotal).toEqual(0);
    });
  });

  describe('incrementUsedCount', () => {
    it('should call findByIdAndUpdate', async () => {
      await service.incrementUsedCount('id');
      expect(mockVoucherModel.findByIdAndUpdate).toHaveBeenCalledWith('id', { $inc: { usedCount: 1 } });
    });
  });

  describe('getAllVouchers', () => {
    it('should return vouchers', async () => {
      mockVoucherModel.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ code: 'TEST' }]) });
      const result = await service.getAllVouchers();
      expect(result).toHaveLength(1);
    });
  });

  describe('getPublicVouchers', () => {
    it('should return public vouchers', async () => {
      mockVoucherModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([{ code: 'TEST' }]),
        }),
      });
      const result = await service.getPublicVouchers();
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteVoucher', () => {
    it('should throw NotFoundException if not found', async () => {
      mockVoucherModel.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.deleteVoucher('id')).rejects.toThrow(NotFoundException);
    });

    it('should delete successfully', async () => {
      mockVoucherModel.findByIdAndDelete.mockResolvedValue({ _id: 'id' });
      const result = await service.deleteVoucher('id');
      expect(result).toEqual({ message: 'Đã xóa mã giảm giá thành công' });
    });
  });
});
