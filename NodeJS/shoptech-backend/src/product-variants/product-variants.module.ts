import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariantsController } from './product-variants.controller';
import { ProductVariant, ProductVariantSchema } from './schemas/product-variant.schema';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProductVariant.name, schema: ProductVariantSchema }]),
    StockMovementsModule
  ],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService],
  exports: [ProductVariantsService] // Export để Carts và Orders xài ké sau này
})
export class ProductVariantsModule {}