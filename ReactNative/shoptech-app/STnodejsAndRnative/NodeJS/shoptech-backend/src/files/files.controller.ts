import {
  Controller, Post, UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator, UseGuards, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('files')
export class FilesController {

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    // 1. NƠI LƯU TRỮ VÀ ĐẶT TÊN
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),

    // 2. CÁCH MỚI: BỘ LỌC CHẶN TỪ CỬA (Tuyệt đối không có lỗi lặt vặt)
    fileFilter: (req, file, callback) => {
      // Chấp nhận mọi định dạng có chữ "image" (image/jpeg, image/png, image/webp...)
      if (!file.mimetype.includes('image')) {
        return callback(new BadRequestException('Chỉ chấp nhận file định dạng hình ảnh!'), false);
      }
      callback(null, true);
    },
  }))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Chỉ giữ lại bộ đếm dung lượng (Tối đa 5MB)
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    return {
      message: 'Upload ảnh thành công',
      fileName: file.filename,
      path: `/uploads/${file.filename}`,
    };
  }
}