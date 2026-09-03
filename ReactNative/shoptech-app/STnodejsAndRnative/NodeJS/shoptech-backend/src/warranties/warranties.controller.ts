import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { WarrantiesService } from './warranties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema'; // Đảm bảo import đúng Role
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';

@Controller('warranties')
export class WarrantiesController {
  constructor(private readonly warrantiesService: WarrantiesService) {}

  // User tự tra cứu bảo hành của mình
  @UseGuards(JwtAuthGuard)
  @Get('my-warranties')
  async getMyWarranties(@Req() req) {
    return await this.warrantiesService.getMyWarranties(req.user.userId);
  }

  // Admin tạo phiếu bảo hành thủ công
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Post()
  async create(@Body() createDto: CreateWarrantyDto) {
    return await this.warrantiesService.create(createDto);
  }

  // Admin sửa phiếu bảo hành
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateWarrantyDto) {
    return await this.warrantiesService.update(id, updateDto);
  }

  // Admin xóa phiếu bảo hành
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.warrantiesService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    async findAll() {
      return await this.warrantiesService.findAll();
    }

    // Merchant lấy danh sách bảo hành
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STORE_OWNER)
    @Get('merchant')
    async getMerchantWarranties() {
      return await this.warrantiesService.getMerchantWarranties();
    }
}