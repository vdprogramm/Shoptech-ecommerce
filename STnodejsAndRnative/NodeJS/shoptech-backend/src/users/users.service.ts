import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, Role } from './schemas/user.schema'; // Cập nhật: Import thêm Role
import { CreateUserDto } from './dto/create-user.dto';
import { MailService } from '../mail/mail.service'; // Cập nhật: Import MailService

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private mailService: MailService, // Cập nhật: Inject MailService vào đây
  ) { }

  async onModuleInit() {
    const adminEmail = 'admin@shoptech.com';
    const existingAdmin = await this.userModel.findOne({ email: adminEmail });
    if (!existingAdmin) {
      this.logger.log('Đang khởi tạo tài khoản Admin mặc định...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);

      const adminUser = new this.userModel({
        fullName: 'Administrator',
        email: adminEmail,
        passwordHash,
        roles: [Role.ADMIN],
        isActive: true,
      });

      await adminUser.save();
      this.logger.log(`Tài khoản Admin đã được tạo thành công (${adminEmail})`);
    } else {
      this.logger.log(`Tài khoản Admin đã tồn tại (${adminEmail})`);
    }
  }

  // 1. Tạo người dùng mới (Đã thêm logic OTP)
  // Cập nhật: Đổi kiểu trả về thành Promise<any> vì chúng ta sẽ trả về thông báo thay vì object User
  async create(createUserDto: CreateUserDto): Promise<any> {
    const { email, password, ...rest } = createUserDto;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // --- LOGIC MỚI: TẠO MÃ OTP ---
    // Sinh mã ngẫu nhiên 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Thời gian hết hạn là 15 phút tính từ hiện tại
    const codeExpiredAt = new Date(Date.now() + 15 * 60 * 1000);

    // Kiểm tra xem đây là khách hay nhân viên (Nhân viên thì active luôn)
    const isStaffOrAdmin = createUserDto.roles?.some(
      role => role === Role.STORE_STAFF || role === Role.STORE_OWNER || role === Role.ADMIN || role === Role.SHIPPER
    );

    const newUser = new this.userModel({
      ...rest,
      email,
      passwordHash,
      verificationCode: otp,
      codeExpiredAt,
      isActive: isStaffOrAdmin ? true : false, // Nhân viên: true, Khách hàng: false
    });

    await newUser.save();

    // --- LOGIC MỚI: GỬI EMAIL ---
    if (!newUser.isActive) {
      // Dùng .catch để app không bị crash nếu có lỗi mạng khi gửi mail
      this.mailService.sendVerificationOtp(email, otp).catch(console.error);
      return {
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực.',
        email: email
      };
    }

    // Nếu là nhân viên tạo thì trả về thông tin luôn
    return newUser;
  }

  // --- HÀM MỚI: XỬ LÝ XÁC THỰC EMAIL ---
  async verifyEmail(email: string, otp: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    if (user.isActive) throw new BadRequestException('Tài khoản đã được kích hoạt từ trước');

    // Kiểm tra xem OTP có khớp không
    if (user.verificationCode !== otp) {
      throw new BadRequestException('Mã xác thực không hợp lệ');
    }

    // SỬA Ở ĐÂY: Thêm điều kiện "!user.codeExpiredAt ||"
    if (!user.codeExpiredAt || user.codeExpiredAt < new Date()) {
      throw new BadRequestException('Mã xác thực đã hết hạn');
    }

    // Xác thực thành công -> Cập nhật trạng thái và xóa OTP cho sạch Database
    user.isActive = true;
    user.verificationCode = undefined;
    user.codeExpiredAt = undefined;

    await user.save();

    return { message: 'Kích hoạt tài khoản thành công! Bạn đã có thể đăng nhập.' };
  }

  // 2. Lấy danh sách tất cả người dùng
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  // 3. Tìm người dùng theo ID
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  // 4. Tìm người dùng theo Email (Dùng cho module Auth đăng nhập sau này)
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+passwordHash').exec();
  }

  // 4.5 Xử lý người dùng từ các mạng xã hội (Google, Twitter)
  async findOrCreateSocialUser(profile: any, provider: 'google' | 'twitter'): Promise<User> {
    const { email, name, sub: id } = profile;
    let user = await this.userModel.findOne({ email }).exec();

    if (user) {
      if (provider === 'google' && !user.googleId) user.googleId = id;
      if (provider === 'twitter' && !user.twitterId) user.twitterId = id;

      user.isActive = true;
      await user.save();
      return user;
    }

    const newUser = new this.userModel({
      email,
      fullName: name || `${provider} User`,
      googleId: provider === 'google' ? id : undefined,
      twitterId: provider === 'twitter' ? id : undefined,
      isActive: true, // Tài khoản MXH đã được xác thực email
    });
    return newUser.save();
  }

  // 5. Xóa người dùng trong hệ thống
  async remove(id: string) {
    // Tìm và xóa user trong Database
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

    // Nếu tìm không thấy user đó (có thể bị xóa từ trước rồi)
    if (!deletedUser) {
      throw new NotFoundException('Không tìm thấy người dùng này để xóa');
    }

    return { message: 'Đã xóa người dùng thành công' };
  }

  // 6. Cập nhật quyền (Role) cho người dùng
  async updateRole(id: string, roles: string[]) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { roles: roles } }, // Ghi đè quyền mới
      { new: true }
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng để cấp quyền');
    }
    return updatedUser;
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<any> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { passwordHash: newPasswordHash } }, // Cập nhật chuỗi hash mới mã hóa từ bcrypt
      { new: true }
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng để thực hiện đổi mật khẩu');
    }
    return updatedUser;
  }

  async findStaffByStore(storeId: string): Promise<User[]> {
    return this.userModel.find({
      storeId: storeId,
      roles: { $in: [Role.STORE_STAFF, Role.STORE_OWNER] }
    }).select('-passwordHash').exec();
  }

  async updateOnlineStatus(userId: string, isOnline: boolean) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { isOnline: isOnline } },
      { new: true } // Trả về dữ liệu user sau khi đã cập nhật mới
    ).select('-passwordHash'); // Không trả về mật mã hóa để bảo mật

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy tài khoản shipper này trên hệ thống');
    }

    return {
      message: `Đã chuyển trạng thái sang ${isOnline ? 'BẬT (Trực tuyến)' : 'TẮT (Ngoại tuyến)'} thành công`,
      data: updatedUser
    };
  }

  async toggleActivation(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    user.isActive = !user.isActive;
    await user.save();

    return {
      message: `Tài khoản đã được ${user.isActive ? 'kích hoạt' : 'hủy kích hoạt'} thành công!`,
      data: user
    };
  }

  async updateProfile(userId: string, updateData: any) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return updatedUser;
  }
}