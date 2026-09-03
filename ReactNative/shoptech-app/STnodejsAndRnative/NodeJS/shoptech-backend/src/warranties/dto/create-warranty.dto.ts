import { IsNotEmpty, IsMongoId, IsDateString, IsNumber } from 'class-validator';

export class CreateWarrantyDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsMongoId()
  @IsNotEmpty()
  orderId: string;

  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsNumber()
  @IsNotEmpty()
  durationMonths: number; // Để tính toán endDate ở Service
}