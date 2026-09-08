import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WarrantiesService } from './warranties.service';
import { WarrantiesController } from './warranties.controller';
import { Warranty, WarrantySchema } from './schemas/warranty.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Warranty.name, schema: WarrantySchema }])
  ],
  controllers: [WarrantiesController],
  providers: [WarrantiesService],
})
export class WarrantiesModule {}