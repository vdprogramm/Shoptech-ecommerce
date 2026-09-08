import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShippingMethodsService } from './shipping-methods.service';
import { ShippingMethodsController } from './shipping-methods.controller';
import { ShippingMethod, ShippingMethodSchema } from './schemas/shipping-method.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ShippingMethod.name, schema: ShippingMethodSchema }])
  ],
  controllers: [ShippingMethodsController],
  providers: [ShippingMethodsService],
  exports: [ShippingMethodsService] // Xong phần này bạn có thể nhúng vào OrdersModule để tính phí ship
})
export class ShippingMethodsModule {}