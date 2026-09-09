import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './addresses.service';
import { getModelToken } from '@nestjs/mongoose';
import { Address } from './schemas/address.schema';
import { NotFoundException } from '@nestjs/common';

describe('AddressesService', () => {
  let service: AddressesService;
  let mockAddressModel: any;
  let addressModelConstructor: any;

  beforeEach(async () => {
    mockAddressModel = {
      updateMany: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndDelete: jest.fn(),
    };

    addressModelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: 'new_id' }),
    }));
    addressModelConstructor.updateMany = mockAddressModel.updateMany;
    addressModelConstructor.countDocuments = mockAddressModel.countDocuments;
    addressModelConstructor.find = mockAddressModel.find;
    addressModelConstructor.findOne = mockAddressModel.findOne;
    addressModelConstructor.findOneAndDelete = mockAddressModel.findOneAndDelete;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: getModelToken(Address.name),
          useValue: addressModelConstructor,
        },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('gỡ mặc định cũ nếu là địa chỉ mặc định', async () => {
      mockAddressModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
      mockAddressModel.countDocuments.mockResolvedValue(1);

      const result = await service.create('user1', { street: 'abc', isDefault: true } as any);
      expect(mockAddressModel.updateMany).toHaveBeenCalledWith({ user: 'user1' }, { $set: { isDefault: false } });
      expect(result.isDefault).toBe(true);
    });

    it('tự ép thành mặc định nếu chưa có địa chỉ nào', async () => {
      mockAddressModel.countDocuments.mockResolvedValue(0);
      
      const result = await service.create('user1', { street: 'abc', isDefault: false } as any);
      expect(result.isDefault).toBe(true);
    });
  });

  describe('findAllByUser', () => {
    it('trả về danh sách địa chỉ', async () => {
      const mockExec = jest.fn().mockResolvedValue([{ _id: 'addr1' }]);
      mockAddressModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: mockExec }) });

      const result = await service.findAllByUser('user1');
      expect(result).toHaveLength(1);
    });
  });

  describe('setDefault', () => {
    it('văng lỗi NotFoundException nếu không tìm thấy địa chỉ', async () => {
      mockAddressModel.findOne.mockResolvedValue(null);
      await expect(service.setDefault('user1', 'addr1')).rejects.toThrow(NotFoundException);
    });

    it('cập nhật thành công', async () => {
      const mockAddress = { _id: 'addr1', save: jest.fn().mockResolvedValue({ _id: 'addr1', isDefault: true }) };
      mockAddressModel.findOne.mockResolvedValue(mockAddress);
      mockAddressModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.setDefault('user1', 'addr1');
      expect(mockAddressModel.updateMany).toHaveBeenCalledWith({ user: 'user1' }, { $set: { isDefault: false } });
      expect(mockAddress.isDefault).toBe(true);
      expect(mockAddress.save).toHaveBeenCalled();
      expect(result.isDefault).toBe(true);
    });
  });

  describe('remove', () => {
    it('văng lỗi NotFoundException nếu không tìm thấy', async () => {
      mockAddressModel.findOneAndDelete.mockResolvedValue(null);
      await expect(service.remove('user1', 'addr1')).rejects.toThrow(NotFoundException);
    });

    it('xóa thành công', async () => {
      mockAddressModel.findOneAndDelete.mockResolvedValue({ _id: 'addr1' });
      const result = await service.remove('user1', 'addr1');
      expect(result.message).toBeDefined();
    });
  });

  describe('update', () => {
    it('văng lỗi NotFoundException nếu không tìm thấy', async () => {
      mockAddressModel.findOne.mockResolvedValue(null);
      await expect(service.update('user1', 'addr1', {})).rejects.toThrow(NotFoundException);
    });

    it('cập nhật thành công nếu có isDefault = true', async () => {
      const mockAddress = { _id: 'addr1', save: jest.fn().mockResolvedValue({ _id: 'addr1', isDefault: true }) };
      mockAddressModel.findOne.mockResolvedValue(mockAddress);
      mockAddressModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

      await service.update('user1', 'addr1', { isDefault: true });
      expect(mockAddressModel.updateMany).toHaveBeenCalledWith({ user: 'user1', _id: { $ne: 'addr1' } }, { $set: { isDefault: false } });
      expect(mockAddress.save).toHaveBeenCalled();
    });

    it('cập nhật thành công thông thường', async () => {
      const mockAddress = { _id: 'addr1', save: jest.fn().mockResolvedValue({ _id: 'addr1', street: 'new' }) };
      mockAddressModel.findOne.mockResolvedValue(mockAddress);

      await service.update('user1', 'addr1', { street: 'new' } as any);
      expect(mockAddressModel.updateMany).not.toHaveBeenCalled();
      expect(mockAddress.save).toHaveBeenCalled();
    });
  });
});
