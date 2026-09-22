import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    createUserDto.roles = [Role.CUSTOMER];

    const user = await this.usersService.create(createUserDto);
    return {
      message: 'Khách hàng đăng ký tài khoản thành công',
      data: user,
    };
  }

  @Post('verify-email')
  verifyEmail(@Body() body: { email: string; otp: string }) {
    return this.usersService.verifyEmail(body.email, body.otp);
  }

  @Get('merchant/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_OWNER, Role.STORE_STAFF)
  async getMerchantStaff(@Req() req: any) {
    const storeId = req.user.storeId; // Lấy storeId giải mã từ Token ra
    if (!storeId) {
      throw new BadRequestException('Tài khoản của bạn chưa được liên kết với cửa hàng nào.');
    }
    return this.usersService.findStaffByStore(storeId);
  }

  @Post('merchant/create-staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_OWNER, Role.STORE_STAFF)
  async merchantCreateStaff(@Body() createStaffDto: any, @Req() req: any) {
    const storeId = req.user.storeId;
    if (!storeId) {
      throw new BadRequestException('Bạn không có quyền tạo nhân viên do chưa thuộc chi nhánh nào.');
    }

    createStaffDto.storeId = storeId;
    createStaffDto.roles = [Role.STORE_STAFF];
    createStaffDto.isActive = true; // Bật sẵn active để nhân viên đăng nhập được luôn

    const user = await this.usersService.create(createStaffDto);
    return {
      message: 'Tạo tài khoản nhân viên chi nhánh thành công',
      data: user,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('staff')
  async createStaff(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: 'Tạo tài khoản nội bộ thành công',
      data: user,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateRole(
    @Param('id') id: string,
    @Body('roles') roles: string[]
  ) {
    return this.usersService.updateRole(id, roles);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/toggle-activation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggleActivation(@Param('id') id: string) {
    return this.usersService.toggleActivation(id);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
    @Patch('shipper/toggle-online')
    async toggleOnline(@Req() req: any, @Body('isOnline') isOnline: boolean) {
      const userId = req.user.userId || req.user._id;
      return this.usersService.updateOnlineStatus(userId, isOnline);
    }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/update')
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    const userId = req.user.userId || req.user._id;
    const user = await this.usersService.updateProfile(userId, updateData);
    return {
      message: 'Cập nhật thông tin thành công',
      data: user,
    };
  }
}