import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({ example: 'Tôi muốn tư vấn laptop cấu hình cao', description: 'Nội dung tin nhắn' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1', description: 'ID của phiên chat (để trống nếu là câu đầu tiên)', required: false })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ description: 'Lịch sử chat từ Frontend gửi lên', required: false })
    @IsOptional()
    @IsArray()
    history?: any[];
}