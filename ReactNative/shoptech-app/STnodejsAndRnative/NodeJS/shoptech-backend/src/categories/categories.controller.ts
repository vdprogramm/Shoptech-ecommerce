import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 🟢 Public: Ai cũng có thể lấy danh sách danh mục
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // 🟢 Public: Lấy chi tiết 1 danh mục
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  // 🔴 Protected: Chỉ ADMIN và STAFF mới được thêm danh mục
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STORE_OWNER)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
      return this.categoriesService.update(id, updateCategoryDto);
    }

@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}