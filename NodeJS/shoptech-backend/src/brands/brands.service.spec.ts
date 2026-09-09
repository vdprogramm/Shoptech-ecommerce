import { Test, TestingModule } from '@nestjs/testing';
import { BrandsService } from './brands.service';
import { getModelToken } from '@nestjs/mongoose';
import { Brand } from './schemas/brand.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BrandsService', () => {
  let service: BrandsService;
  let mockBrandModel: any;
  let brandModelConstructor: any;

  beforeEach(async () => {
    mockBrandModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    brandModelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: 'brand1' }),
    }));

    brandModelConstructor.find = mockBrandModel.find;
    brandModelConstructor.findById = mockBrandModel.findById;
    brandModelConstructor.findByIdAndUpdate = mockBrandModel.findByIdAndUpdate;
    brandModelConstructor.findByIdAndDelete = mockBrandModel.findByIdAndDelete;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getModelToken(Brand.name),
          useValue: brandModelConstructor,
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create brand', async () => {
      const result = await service.create({ name: 'Brand1' } as any);
      expect(result.name).toEqual('Brand1');
    });
  });

  describe('findAll', () => {
    it('should return all brands', async () => {
      mockBrandModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ name: 'Brand1' }]) });
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockBrandModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('id')).rejects.toThrow(NotFoundException);
    });

    it('should return brand if found', async () => {
      mockBrandModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'Brand1' }) });
      const result = await service.findOne('id');
      expect(result.name).toEqual('Brand1');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if not found', async () => {
      mockBrandModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update('id', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on duplicate name', async () => {
      mockBrandModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue({ code: 11000 }),
      });
      await expect(service.update('id', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should rethrow unknown errors', async () => {
      mockBrandModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Unknown')),
      });
      await expect(service.update('id', {} as any)).rejects.toThrow(Error);
    });

    it('should update successfully', async () => {
      mockBrandModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'Updated' }) });
      const result = await service.update('id', {} as any);
      expect(result.name).toEqual('Updated');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if not found', async () => {
      mockBrandModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('id')).rejects.toThrow(NotFoundException);
    });

    it('should remove successfully', async () => {
      mockBrandModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'id' }) });
      const result = await service.remove('id');
      expect(result.statusCode).toEqual(200);
      expect(result.deletedId).toEqual('id');
    });
  });
});
