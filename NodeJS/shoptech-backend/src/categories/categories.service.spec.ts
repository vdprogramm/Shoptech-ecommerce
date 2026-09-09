import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getModelToken } from '@nestjs/mongoose';
import { Category } from './schemas/category.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockCategoryModel: any;
  let categoryModelConstructor: any;

  beforeEach(async () => {
    mockCategoryModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    categoryModelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: 'cat1' }),
    }));

    categoryModelConstructor.find = mockCategoryModel.find;
    categoryModelConstructor.findById = mockCategoryModel.findById;
    categoryModelConstructor.findByIdAndUpdate = mockCategoryModel.findByIdAndUpdate;
    categoryModelConstructor.findByIdAndDelete = mockCategoryModel.findByIdAndDelete;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(Category.name),
          useValue: categoryModelConstructor,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create category', async () => {
      const result = await service.create({ name: 'Cat1' } as any);
      expect(result.name).toEqual('Cat1');
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockCategoryModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ name: 'Cat1' }]) });
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockCategoryModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('id')).rejects.toThrow(NotFoundException);
    });

    it('should return category if found', async () => {
      mockCategoryModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'Cat1' }) });
      const result = await service.findOne('id');
      expect(result.name).toEqual('Cat1');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if not found', async () => {
      mockCategoryModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update('id', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on duplicate name', async () => {
      mockCategoryModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue({ code: 11000 }),
      });
      await expect(service.update('id', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should rethrow unknown errors', async () => {
      mockCategoryModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Unknown')),
      });
      await expect(service.update('id', {} as any)).rejects.toThrow(Error);
    });

    it('should update successfully', async () => {
      mockCategoryModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ name: 'Updated' }) });
      const result = await service.update('id', {} as any);
      expect(result.name).toEqual('Updated');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if not found', async () => {
      mockCategoryModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('id')).rejects.toThrow(NotFoundException);
    });

    it('should remove successfully', async () => {
      mockCategoryModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'id' }) });
      const result = await service.remove('id');
      expect(result.statusCode).toEqual(200);
      expect(result.deletedId).toEqual('id');
    });
  });
});
