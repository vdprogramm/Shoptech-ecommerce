import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  @IsString()
  shippingAddress: string;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @IsOptional()
    @IsString()
    shippingMethod?: string;

    @IsOptional()
    @IsString()
    voucherCode?: string;

    @IsOptional()
    @IsNumber()
    pointsUsed?: number;
}