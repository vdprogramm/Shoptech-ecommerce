import { Controller, Get, Post, Body, UseGuards, Param, Delete, Patch } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // 🟢 Public: Xem danh sách thương hiệu
  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  // 🟢 Public: Lấy chi tiết 1 thương hiệu
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  // 🔴 Protected: Thêm thương hiệu (Yêu cầu quyền hạn)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER, Role.STORE_STAFF)
  @Post()
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STORE_OWNER, Role.STORE_STAFF)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
      return this.brandsService.update(id, updateBrandDto);
    }

    // 🔥 THÊM MỚI: Xóa thương hiệu (DELETE)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STORE_OWNER, Role.STORE_STAFF)
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.brandsService.remove(id);
    }
}