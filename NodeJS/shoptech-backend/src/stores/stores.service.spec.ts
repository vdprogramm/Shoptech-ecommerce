import { Test, TestingModule } from '@nestjs/testing';
import { StoresService } from './stores.service';
import { getModelToken } from '@nestjs/mongoose';
import { Store } from './schemas/store.schema';
import { User } from '../users/schemas/user.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('StoresService', () => {
  let service: StoresService;
  let mockStoreModel: any;
  let mockUserModel: any;

  const validObjectId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    mockStoreModel = {
      new: jest.fn().mockImplementation((dto) => ({
        ...dto,
        save: jest.fn().mockResolvedValue({ _id: 'store1', ...dto }),
      })),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: 'store1' }]),
        }),
        exec: jest.fn().mockResolvedValue([{ _id: 'store1' }]),
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: validObjectId, managerId: validObjectId }),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: validObjectId, name: 'Updated' }),
      }),
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: validObjectId }),
      }),
    };

    // Fix constructor pattern
    const storeModelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'store1', ...dto }),
    }));
    Object.assign(storeModelConstructor, mockStoreModel);

    mockUserModel = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: validObjectId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getModelToken(Store.name),
          useValue: storeModelConstructor,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw error if managerId is invalid', async () => {
      await expect(service.create({ managerId: 'invalid' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should create store and update user', async () => {
      const result = await service.create({ managerId: validObjectId, name: 'Test' } as any);
      expect(result).toBeDefined();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all stores', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw error if id is invalid', async () => {
      await expect(service.findOne('invalid')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFound if store not found', async () => {
      mockStoreModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.findOne(validObjectId)).rejects.toThrow(NotFoundException);
    });

    it('should return a store', async () => {
      const result = await service.findOne(validObjectId);
      expect(result).toBeDefined();
    });
  });

  describe('findByManager', () => {
    it('should throw error if managerId is invalid', async () => {
      await expect(service.findByManager('invalid')).rejects.toThrow(BadRequestException);
    });

    it('should return stores', async () => {
      const result = await service.findByManager(validObjectId);
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should throw error if id is invalid', async () => {
      await expect(service.update('invalid', {})).rejects.toThrow(BadRequestException);
    });

    it('should update store', async () => {
      const result = await service.update(validObjectId, { name: 'Updated' } as any);
      expect(result).toBeDefined();
    });

    it('should throw NotFound if store not found', async () => {
      mockStoreModel.findByIdAndUpdate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.update(validObjectId, { name: 'Updated' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should throw error if id is invalid', async () => {
      await expect(service.remove('invalid')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFound if store not found for deletion', async () => {
      mockStoreModel.findByIdAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.remove(validObjectId)).rejects.toThrow(NotFoundException);
    });

    it('should delete store and update user', async () => {
      const result = await service.remove(validObjectId);
      expect(result.message).toBe('Xóa cửa hàng thành công.');
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
