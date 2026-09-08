import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVietQrDto {
  @IsNotEmpty({ message: 'Mã subOrderId không được để trống' })
  @IsString({ message: 'Mã subOrderId phải là một chuỗi ký tự' })
  subOrderId: string;
}