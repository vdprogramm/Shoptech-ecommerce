import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductAttributesService } from './product-attributes.service';
import { ProductAttributesController } from './product-attributes.controller';
import { ProductAttribute, ProductAttributeSchema } from './schemas/product-attribute.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProductAttribute.name, schema: ProductAttributeSchema }])
  ],
  controllers: [ProductAttributesController],
  providers: [ProductAttributesService],
  exports: [ProductAttributesService]
})
export class ProductAttributesModule {}