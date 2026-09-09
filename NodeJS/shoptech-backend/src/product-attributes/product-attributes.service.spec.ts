import { Test, TestingModule } from '@nestjs/testing';
import { ProductAttributesService } from './product-attributes.service';
import { getModelToken } from '@nestjs/mongoose';
import { ProductAttribute } from './schemas/product-attribute.schema';

describe('ProductAttributesService', () => {
  let service: ProductAttributesService;
  let mockAttrModel: any;

  beforeEach(async () => {
    mockAttrModel = {
      deleteMany: jest.fn(),
      insertMany: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductAttributesService,
        {
          provide: getModelToken(ProductAttribute.name),
          useValue: mockAttrModel,
        },
      ],
    }).compile();

    service = module.get<ProductAttributesService>(ProductAttributesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertAttributes', () => {
    it('should delete existing and insert new attributes', async () => {
      mockAttrModel.deleteMany.mockResolvedValue({});
      mockAttrModel.insertMany.mockResolvedValue([{ key: 'RAM', value: '16GB' }]);

      const result = await service.upsertAttributes('prodId', [{ key: 'RAM', value: '16GB' }]);
      expect(mockAttrModel.deleteMany).toHaveBeenCalledWith({ product: 'prodId' });
      expect(mockAttrModel.insertMany).toHaveBeenCalledWith([
        { product: 'prodId', key: 'RAM', value: '16GB' },
      ]);
      expect(result).toHaveLength(1);
    });
  });

  describe('getAttributesByProduct', () => {
    it('should return attributes for a product', async () => {
      mockAttrModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ key: 'RAM', value: '16GB' }]),
        }),
      });

      const result = await service.getAttributesByProduct('prodId');
      expect(result).toHaveLength(1);
    });
  });

  describe('filterProductsByAttributes', () => {
    it('should filter products by attributes and return unique ids', async () => {
      mockAttrModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { product: 'prod1' },
            { product: 'prod2' },
            { product: 'prod1' },
          ]),
        }),
      });

      const result = await service.filterProductsByAttributes({ RAM: '16GB' });
      expect(result).toEqual(['prod1', 'prod2']);
    });
  });

  describe('deleteAttributes', () => {
    it('should delete all attributes for a product', async () => {
      mockAttrModel.deleteMany.mockResolvedValue({ deletedCount: 2 });
      const result = await service.deleteAttributes('prodId');
      expect(result.deletedCount).toEqual(2);
    });
  });
});
