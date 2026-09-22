import { IsNotEmpty, IsNumber, IsMongoId, IsOptional, IsObject, IsArray, IsString } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  name: string;

@IsNotEmpty()
  @IsArray({ message: 'Store phải là một mảng danh sách cửa hàng' })
  @IsMongoId({ each: true, message: 'Mỗi Store phải là một mã Mongo ID hợp lệ' }) // 🔥 Thêm each: true
  store: string[];

  @IsMongoId()
  category: string;

  @IsMongoId()
  brand: string;

@IsOptional()
  @IsNumber()
  price: number;

@IsOptional()
  @IsNumber()
  stock: number;

  @IsOptional()
    @IsArray({ message: 'Variants phải là một mảng' })
    variants?: any[];

  @IsString()
    @IsOptional()
    description?: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsObject()
  @IsOptional()
  specs?: Record<string, any>;
}