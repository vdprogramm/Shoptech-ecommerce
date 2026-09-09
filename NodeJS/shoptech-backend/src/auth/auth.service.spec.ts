import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let mailService: MailService;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockMailService = {
    sendResetPasswordEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('phải văng lỗi Unauthorized nếu không tìm thấy email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login({ email: 'test@test.com', password: '123' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('phải văng lỗi nếu tài khoản đăng ký qua Google (không có password)', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        email: 'test@test.com',
        passwordHash: null,
      });

      await expect(authService.login({ email: 'test@test.com', password: '123' })).rejects.toThrow(
        new UnauthorizedException('Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.'),
      );
    });

    it('phải văng lỗi nếu password sai', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        email: 'test@test.com',
        passwordHash: 'hashedpassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(
        new UnauthorizedException('Email hoặc mật khẩu không đúng'),
      );
    });

    it('phải văng lỗi nếu tài khoản chưa kích hoạt', async () => {
      process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
      mockUsersService.findByEmail.mockResolvedValue({
        email: 'test@test.com',
        passwordHash: 'hashedpassword',
        isActive: false
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.login({ email: 'test@test.com', password: '123' })).rejects.toThrow(
        new UnauthorizedException('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.'),
      );
    });

    it('đăng nhập thành công và trả về token', async () => {
      const mockUser = {
        _id: 'userid',
        email: 'test@test.com',
        passwordHash: 'hashedpassword',
        isActive: true,
        roles: ['user'],
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('mockToken');

      // Tạm thời override process.env để test nhánh requireVerification
      process.env.REQUIRE_EMAIL_VERIFICATION = 'true';

      const result = await authService.login({ email: 'test@test.com', password: '123' });

      expect(result.message).toEqual('Đăng nhập thành công');
      expect(result.accessToken).toEqual('mockToken');
      expect(result.user._id).toEqual('userid');
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('phải văng lỗi NotFound nếu email không tồn tại', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(authService.forgotPassword('unknown@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('phải gửi email nếu mọi thứ hợp lệ', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'userid',
        email: 'test@test.com',
        fullName: 'Test User',
      });
      mockJwtService.signAsync.mockResolvedValue('resetToken123');
      mockMailService.sendResetPasswordEmail.mockResolvedValue(true);

      const result = await authService.forgotPassword('test@test.com');

      expect(result.message).toEqual('Liên kết đặt lại mật khẩu đã được gửi tới email của bạn.');
      expect(mockMailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        'test@test.com',
        'Test User',
        'http://localhost:8080/reset-password?token=resetToken123',
      );
    });

    it('văng lỗi BadRequest nếu gửi email thất bại', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'userid',
        email: 'test@test.com',
        fullName: 'Test User',
      });
      mockJwtService.signAsync.mockResolvedValue('resetToken123');
      mockMailService.sendResetPasswordEmail.mockRejectedValue(new Error('Send error'));

      await expect(authService.forgotPassword('test@test.com')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('văng lỗi BadRequest nếu mục đích token không đúng', async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValue({ purpose: 'wrong' });
      await expect(authService.resetPassword('token', 'newpass')).rejects.toThrow(BadRequestException);
    });

    it('văng lỗi BadRequest nếu token sai', async () => {
      mockJwtService.verifyAsync = jest.fn().mockRejectedValue(new Error('Invalid token'));
      await expect(authService.resetPassword('token', 'newpass')).rejects.toThrow(BadRequestException);
    });

    it('văng lỗi NotFound nếu không tìm thấy user', async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValue({ purpose: 'reset_password', email: 'test@test.com' });
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(authService.resetPassword('token', 'newpass')).rejects.toThrow(NotFoundException);
    });

    it('đổi mật khẩu thành công', async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValue({ purpose: 'reset_password', email: 'test@test.com' });
      mockUsersService.findByEmail.mockResolvedValue({ _id: 'userid', email: 'test@test.com' });
      mockUsersService.updatePassword = jest.fn().mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');

      const result = await authService.resetPassword('token', 'newpass');
      expect(result.message).toBe('Đặt lại mật khẩu thành công!');
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('userid', 'hashedpass');
    });
  });

  describe('generateToken', () => {
    it('trả về token', async () => {
      mockJwtService.signAsync.mockResolvedValue('token123');
      const result = await authService.generateToken({ _id: '123', email: 'test', roles: [], storeId: 'store' });
      expect(result).toBe('token123');
    });
  });

  describe('googleLogin', () => {
    it('văng lỗi nếu token không hợp lệ', async () => {
      jest.spyOn(authService['googleClient'], 'verifyIdToken').mockResolvedValue({ getPayload: () => null } as any);
      await expect(authService.googleLogin({ token: 'invalid' })).rejects.toThrow(UnauthorizedException);
    });

    it('đăng nhập thành công', async () => {
      jest.spyOn(authService['googleClient'], 'verifyIdToken').mockResolvedValue({ getPayload: () => ({ email: 'test@test.com' }) } as any);
      (mockUsersService as any).findOrCreateSocialUser = jest.fn().mockResolvedValue({ _id: '123', email: 'test@test.com' });
      mockJwtService.signAsync.mockResolvedValue('token123');

      const result = await authService.googleLogin({ token: 'valid' });
      expect(result.accessToken).toBe('token123');
    });

    it('văng lỗi nếu có exception', async () => {
      jest.spyOn(authService['googleClient'], 'verifyIdToken').mockRejectedValue(new Error('err'));
      await expect(authService.googleLogin({ token: 'valid' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('twitterLogin', () => {
    it('đăng nhập thành công', async () => {
      mockJwtService.signAsync.mockResolvedValue('token123');
      const reqUser = { user: { _id: '123', email: 'test@test.com', storeId: 'store' }, client: 'web' };
      const result = await authService.twitterLogin(reqUser);
      expect(result.accessToken).toBe('token123');
      expect(result.clientType).toBe('web');
    });
  });
});
