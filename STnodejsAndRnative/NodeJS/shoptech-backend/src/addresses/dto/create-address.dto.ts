import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString()
  receiverName: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  ward: string;

  @IsNotEmpty()
  @IsString()
  district: string;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}