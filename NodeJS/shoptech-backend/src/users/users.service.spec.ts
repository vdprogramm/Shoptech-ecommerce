import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, Role } from './schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;
  let mockMailService: any;
  let userModelConstructor: any;

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    // Tạo một hàm constructor ảo cho model (cần thiết cho new this.userModel(...))
    userModelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: mockUserModel.save,
    }));
    // Gắn các hàm tĩnh (findOne) vào hàm constructor
    userModelConstructor.findOne = mockUserModel.findOne;
    userModelConstructor.create = mockUserModel.create;


    mockMailService = {
      sendVerificationOtp: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModelConstructor,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (Tạo tài khoản)', () => {
    it('phải văng lỗi ConflictException nếu email đã tồn tại', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: 'test@example.com' });

      await expect(
        service.create({
          email: 'test@example.com',
          password: '123',
          fullName: 'Test',
          phone: '0123456789'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('tạo thành công và gửi OTP nếu là khách hàng', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUserModel.save.mockResolvedValue(true);

      const result = await service.create({
        email: 'newuser@example.com',
        password: '123',
        fullName: 'New User',
        phone: '0123456789',
        roles: [Role.CUSTOMER]
      });

      expect(result.message).toEqual('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực.');
      expect(result.email).toEqual('newuser@example.com');
      expect(mockMailService.sendVerificationOtp).toHaveBeenCalledWith('newuser@example.com', expect.any(String));
      expect(mockUserModel.save).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('trả về user nếu tìm thấy email', async () => {
      const mockExec = jest.fn().mockResolvedValue({ email: 'test@example.com' });
      const mockSelect = jest.fn().mockReturnValue({ exec: mockExec });
      mockUserModel.findOne.mockReturnValue({ select: mockSelect });

      const user = await service.findByEmail('test@example.com');
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('verifyEmail', () => {
    it('phải văng lỗi NotFoundException nếu không tìm thấy người dùng', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail('test@example.com', '123456')).rejects.toThrow(NotFoundException);
    });

    it('phải văng lỗi BadRequestException nếu tài khoản đã active', async () => {
      mockUserModel.findOne.mockResolvedValue({ isActive: true });
      await expect(service.verifyEmail('test@example.com', '123456')).rejects.toThrow(BadRequestException);
    });

    it('phải văng lỗi BadRequestException nếu OTP không khớp', async () => {
      mockUserModel.findOne.mockResolvedValue({ isActive: false, verificationCode: '654321' });
      await expect(service.verifyEmail('test@example.com', '123456')).rejects.toThrow(BadRequestException);
    });

    it('phải văng lỗi BadRequestException nếu OTP hết hạn', async () => {
      mockUserModel.findOne.mockResolvedValue({ 
        isActive: false, 
        verificationCode: '123456', 
        codeExpiredAt: new Date(Date.now() - 1000) 
      });
      await expect(service.verifyEmail('test@example.com', '123456')).rejects.toThrow(BadRequestException);
    });

    it('kích hoạt thành công nếu hợp lệ', async () => {
      const mockUser = {
        isActive: false,
        verificationCode: '123456',
        codeExpiredAt: new Date(Date.now() + 100000),
        save: jest.fn().mockResolvedValue(true)
      };
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.verifyEmail('test@example.com', '123456');
      expect(result.message).toEqual('Kích hoạt tài khoản thành công! Bạn đã có thể đăng nhập.');
      expect(mockUser.isActive).toBe(true);
      expect(mockUser.verificationCode).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('phải trả về danh sách user', async () => {
      mockUserModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ _id: 'user1' }])
      });
      userModelConstructor.find = mockUserModel.find;

      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('trả về user nếu tìm thấy id', async () => {
      mockUserModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: 'user1' })
      });
      userModelConstructor.findById = mockUserModel.findById;

      const result = await service.findById('user1');
      expect(result).toBeDefined();
    });
  });

  describe('updateProfile & remove', () => {
    it('updateProfile thành công', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user1', fullName: 'Updated' })
      });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      const result = await service.updateProfile('user1', { fullName: 'Updated' } as any);
      expect(result).toBeDefined();
    });

    it('remove thành công', async () => {
      mockUserModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'user1' })
      });
      userModelConstructor.findByIdAndDelete = mockUserModel.findByIdAndDelete;

      const result = await service.remove('user1');
      expect(result).toBeDefined();
    });

    it('updateProfile văng lỗi NotFoundException', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      await expect(service.updateProfile('id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('onModuleInit', () => {
    it('khởi tạo admin nếu chưa tồn tại', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
      mockUserModel.save.mockResolvedValue(true);

      await service.onModuleInit();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'admin@shoptech.com' });
    });

    it('bỏ qua nếu admin đã tồn tại', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: 'admin@shoptech.com' });
      await service.onModuleInit();
      expect(mockUserModel.save).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('trả về user luôn nếu là STAFF/ADMIN', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUserModel.save.mockResolvedValue(true);

      const result = await service.create({
        email: 'staff@example.com',
        password: '123',
        fullName: 'Staff User',
        phone: '0123456789',
        roles: [Role.STORE_STAFF]
      });

      expect(result.isActive).toBe(true);
      expect(result.email).toBe('staff@example.com');
    });
  });

  describe('findById', () => {
    it('văng lỗi NotFoundException nếu không thấy', async () => {
      mockUserModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      userModelConstructor.findById = mockUserModel.findById;
      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOrCreateSocialUser', () => {
    it('cập nhật provider nếu user đã tồn tại', async () => {
      const mockUser = {
        email: 'social@test.com',
        googleId: undefined,
        isActive: false,
        save: jest.fn().mockResolvedValue(true)
      };
      mockUserModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      userModelConstructor.findOne = mockUserModel.findOne;

      const result = await service.findOrCreateSocialUser({ email: 'social@test.com', sub: 'gid123' } as any, 'google');
      expect(result.googleId).toBe('gid123');
      expect(result.isActive).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('tạo mới user nếu chưa tồn tại', async () => {
      mockUserModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      userModelConstructor.findOne = mockUserModel.findOne;
      mockUserModel.save.mockResolvedValue({ email: 'new@test.com' });

      const result = await service.findOrCreateSocialUser({ email: 'new@test.com', name: 'Tw User', sub: 'tw123' } as any, 'twitter');
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('văng lỗi NotFoundException nếu không tìm thấy', async () => {
      mockUserModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      userModelConstructor.findByIdAndDelete = mockUserModel.findByIdAndDelete;
      await expect(service.remove('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('cập nhật role thành công', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ roles: [Role.ADMIN] }) });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      const result = await service.updateRole('id', [Role.ADMIN]);
      expect(result.roles).toContain(Role.ADMIN);
    });

    it('văng lỗi NotFoundException', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      await expect(service.updateRole('id', [])).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    it('cập nhật password thành công', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'id' }) });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      const result = await service.updatePassword('id', 'hash');
      expect(result._id).toBe('id');
    });

    it('văng lỗi NotFoundException', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      await expect(service.updatePassword('id', 'hash')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findStaffByStore', () => {
    it('trả về danh sách staff', async () => {
      mockUserModel.find = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'staff1' }]) }) });
      userModelConstructor.find = mockUserModel.find;

      const result = await service.findStaffByStore('store1');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateOnlineStatus', () => {
    it('cập nhật online thành công', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'id', isOnline: true }) });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      const result = await service.updateOnlineStatus('id', true);
      expect(result.data.isOnline).toBe(true);
    });

    it('văng lỗi NotFoundException', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      await expect(service.updateOnlineStatus('id', true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActivation', () => {
    it('toggle thành công', async () => {
      const mockUser = { isActive: true, save: jest.fn().mockResolvedValue(true) };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      userModelConstructor.findById = mockUserModel.findById;

      const result = await service.toggleActivation('id');
      expect(result.data.isActive).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('văng lỗi NotFoundException', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(null);
      userModelConstructor.findById = mockUserModel.findById;

      await expect(service.toggleActivation('id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addSearchKeyword & addViewedProduct', () => {
    it('addSearchKeyword thành công', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'id' });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      const result = await service.addSearchKeyword('id', 'keyword');
      expect(result).toBeDefined();
    });

    it('bỏ qua nếu keyword rỗng', async () => {
      const result = await service.addSearchKeyword('id', '  ');
      expect(result).toBeUndefined();
    });

    it('addViewedProduct thành công', async () => {
      mockUserModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'id' });
      userModelConstructor.findByIdAndUpdate = mockUserModel.findByIdAndUpdate;

      const result = await service.addViewedProduct('id', 'prodId');
      expect(result).toBeDefined();
    });
  });
});
