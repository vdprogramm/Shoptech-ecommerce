import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { UsersService } from '../users/users.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class TwitterAuthGuard extends AuthGuard('twitter') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const client = request.query.client || request.session?.client;
    let callbackURL = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/auth/twitter/callback';

    // Nếu là Mobile, tự động chuyển callbackURL về IP thật
    if (client === 'mobile') {
      callbackURL = 'http://192.168.2.139:3001/auth/twitter/callback';
    }

    return { callbackURL };
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request.query.client) {
      request.session.client = request.query.client;
    }
    const result = (await super.canActivate(context)) as boolean;
    return result;
  }
}

@Controller('auth') // Route: http://localhost:3001/auth
export class AuthController {
  constructor(private authService: AuthService,
      private usersService: UsersService,) {}

  @HttpCode(HttpStatus.OK) // Đổi status từ 201 (Created) thành 200 (OK) cho hành động login
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  @HttpCode(HttpStatus.OK)
  @Post('google')
  googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }



  @Get('twitter')
  @UseGuards(TwitterAuthGuard)
  async twitterAuth() {
    // Khởi tạo luồng OAuth 1.0a với Twitter
  }

@Get('twitter/callback')
  @UseGuards(TwitterAuthGuard)
  async twitterAuthRedirect(@Req() req, @Res() res) {
    const { user, client } = req.user;

    // Tạo JWT token
    const token = await this.authService.generateToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'https://shoptech-ecommerce.vercel.app';

    // Redirect về client kèm theo token
    if (client === 'mobile') {
      res.redirect(`shoptech://login?token=${token}`);
    } else {
      res.redirect(`${frontendUrl}/login?token=${token}`);
    }
  }

  @HttpCode(HttpStatus.OK) // Trả về 200 OK thay vì 201 Created
    @Post('verify')
    verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
      // Gọi thẳng sang hàm verifyEmail mà bạn vừa viết ở UsersService
      return this.usersService.verifyEmail(verifyEmailDto.email, verifyEmailDto.otp);
    }

@Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  // POST: http://localhost:3001/auth/reset-password
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.passwordMoi
    );
  }
}