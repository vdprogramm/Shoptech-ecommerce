import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  name: string; // Bắt buộc nhập (VD: Laptop, Điện thoại)

  @IsOptional()
  @IsString()
  description?: string; // Không bắt buộc

  @IsOptional()
  @IsString()
  image?: string; // Link ảnh đại diện cho danh mục
}