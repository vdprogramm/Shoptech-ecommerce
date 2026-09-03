import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NewsService } from './news.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

// Cấu hình Multer dùng chung cho cả Create và Update
const multerOptions = {
  storage: diskStorage({
    destination: './uploads', // Thư mục lưu ảnh
    filename: (req, file, cb) => {
      const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    }
  })
};

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  // API: GET /news
  @Get()
  findAll() {
    return this.newsService.findAll();
  }

  // API: GET /news/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  // API: POST /news
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  create(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const newsData = {
      ...body,
      imageUrl: file ? `/uploads/${file.filename}` : null
    };

    console.log("Dữ liệu chuẩn bị lưu:", newsData);
    return this.newsService.create(newsData);
  }

  // API: PUT /news/:id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const updateData = { ...body };

    // Nếu có upload file mới thì cập nhật imageUrl, nếu không thì giữ nguyên ảnh cũ
    if (file) {
      updateData.imageUrl = `/uploads/${file.filename}`;
    }

    console.log(`Dữ liệu cập nhật cho ID ${id}:`, updateData);
    return this.newsService.update(id, updateData);
  }

  // API: DELETE /news/:id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}