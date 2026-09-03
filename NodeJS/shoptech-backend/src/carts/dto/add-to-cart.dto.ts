import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsMongoId({ message: 'ID Sản phẩm không hợp lệ' })
variantId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Số lượng ít nhất phải là 1' })
  quantity: number; // Số lượng muốn thêm
}