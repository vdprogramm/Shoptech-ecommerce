import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBrandDto {
  @IsNotEmpty({ message: 'Tên thương hiệu không được để trống' })
  @IsString()
  name: string; // Bắt buộc (VD: Apple, Samsung)

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string; // Link ảnh logo của hãng
}