import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { TwitterStrategy } from './twitter.strategy';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [
    UsersModule,
    MailModule,
    JwtModule.register({
      global: true, // Cho phép mọi module khác dùng JwtService mà không cần import lại
      secret: 'DoAnShopTech_BiMat_TuyetDoi_123!@#', // Phải khớp với secret bên jwt.strategy.ts
      signOptions: { expiresIn: '1d' }, // Token có hiệu lực 1 ngày
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TwitterStrategy, GoogleStrategy],
})
export class AuthModule {}