import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Role } from '../schemas/user.schema';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsOptional()
  @IsEnum(Role, { each: true, message: 'Quyền không hợp lệ' })
  roles?: Role[];
}