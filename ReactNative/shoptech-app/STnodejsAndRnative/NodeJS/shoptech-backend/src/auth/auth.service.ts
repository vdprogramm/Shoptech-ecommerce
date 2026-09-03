import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { OAuth2Client } from 'google-auth-library';
import { GoogleLoginDto } from './dto/google-login.dto';
import axios from 'axios';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.');
    }

    const isPasswordMatching = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

    if (requireVerification && !user.isActive) {
      throw new UnauthorizedException('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      roles: user.roles,
      storeId: user.storeId ? user.storeId.toString() : null
    };

    return {
      message: 'Đăng nhập thành công',
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        storeId: user.storeId,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate
      },
    };
  }

  async googleLogin(googleLoginDto: GoogleLoginDto) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleLoginDto.token,
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Token Google không hợp lệ.');
      }

      const user = await this.usersService.findOrCreateSocialUser(payload, 'google');

      const jwtPayload = {
        sub: user._id,
        email: user.email,
        roles: user.roles,
        storeId: user.storeId ? user.storeId.toString() : null
      };

      return {
        message: 'Đăng nhập Google thành công',
        accessToken: await this.jwtService.signAsync(jwtPayload),
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          roles: user.roles,
          storeId: user.storeId,
          avatar: user.avatar,
          phone: user.phone,
          gender: user.gender,
          birthDate: user.birthDate
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Xác thực Google thất bại: ' + error.message);
    }
  }



  // --- HÀM XỬ LÝ TWITTER ---
  async twitterLogin(reqUser: any) {
    const { user, client } = reqUser;

    const jwtPayload = {
      sub: user._id,
      email: user.email,
      roles: user.roles,
      storeId: user.storeId ? user.storeId.toString() : null
    };

    return {
      message: 'Đăng nhập Twitter thành công',
      accessToken: await this.jwtService.signAsync(jwtPayload),
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        storeId: user.storeId,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate
      },
      clientType: client
    };
  }

  // --- DUY NHẤT 1 HÀM GENERATE TOKEN ---
  async generateToken(user: any) {
    const jwtPayload = {
      sub: user._id,
      email: user.email,
      roles: user.roles,
      storeId: user.storeId ? user.storeId.toString() : null
    };
    return this.jwtService.signAsync(jwtPayload);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này.');
    }

    const resetPayload = { email: user.email, purpose: 'reset_password' };
    const resetToken = await this.jwtService.signAsync(resetPayload, {
      expiresIn: '15m',
    });

    const resetUrl = `http://localhost:8080/reset-password?token=${resetToken}`;

    try {
      await this.mailService.sendResetPasswordEmail(user.email, user.fullName, resetUrl);
      return {
        message: 'Liên kết đặt lại mật khẩu đã được gửi tới email của bạn.',
      };
    } catch (error) {
      throw new BadRequestException('Có lỗi xảy ra khi gửi email khôi phục. Vui lòng thử lại sau.');
    }
  }

  async resetPassword(token: string, passwordMoi: string) {
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(token);
      if (payload.purpose !== 'reset_password') {
        throw new BadRequestException('Mã xác thực không đúng mục đích sử dụng.');
      }
    } catch (error) {
      throw new BadRequestException('Liên kết xác thực đã hết hạn hoặc không hợp lệ.');
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new NotFoundException('Tài khoản liên kết không còn tồn tại.');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(passwordMoi, salt);

    await this.usersService.updatePassword(user._id.toString(), newPasswordHash);

    return {
      message: 'Đặt lại mật khẩu thành công!',
    };
  }
}