import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // API Tạo cửa hàng: POST /stores
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  // API Lấy toàn bộ danh sách: GET /stores
  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  // API Lấy chi tiết cửa hàng: GET /stores/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }


  // API Lấy danh sách cửa hàng của một quản lý: GET /stores/manager/:managerId
  @Get('manager/:managerId')
  findByManager(@Param('managerId') managerId: string) {
    return this.storesService.findByManager(managerId);
  }
  // API Cập nhật thông tin: PATCH /stores/:id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  // API Xóa cửa hàng: DELETE /stores/:id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }

}
