import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateStoreDto {
  @IsNotEmpty({ message: 'Tên cửa hàng không được để trống' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsNotEmpty({ message: 'ID người quản lý không được để trống' })
  @IsString()
  managerId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
