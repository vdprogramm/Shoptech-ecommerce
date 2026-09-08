import { Test, TestingModule } from '@nestjs/testing';
import { ProductAttributesController } from './product-attributes.controller';

describe('ProductAttributesController', () => {
  let controller: ProductAttributesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductAttributesController],
    }).compile();

    controller = module.get<ProductAttributesController>(ProductAttributesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
