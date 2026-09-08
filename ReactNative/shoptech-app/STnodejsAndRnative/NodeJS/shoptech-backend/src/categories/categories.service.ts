import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<Category>) {}

  // 1. Thêm danh mục mới
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const newCategory = new this.categoryModel(createCategoryDto);
    return newCategory.save();
  }

  // 2. Lấy tất cả danh mục
  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  // 3. Lấy chi tiết 1 danh mục
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục này');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
      try {
        const updatedCategory = await this.categoryModel.findByIdAndUpdate(
          id,
          updateCategoryDto,
          {
            new: true, // Trả về document mới sau khi update
            runValidators: true // Bắt Mongoose chạy lại các validator (VD: không được rỗng)
          }
        ).exec();

        if (!updatedCategory) {
          throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
        }

        return updatedCategory;
      } catch (error) {
        // Bắt lỗi nếu cập nhật trùng tên (unique: true)
        if (error.code === 11000) {
          throw new BadRequestException('Tên danh mục này đã tồn tại, vui lòng chọn tên khác.');
        }
        throw error;
      }
    }

async remove(id: string) {
    const deletedCategory = await this.categoryModel.findByIdAndDelete(id).exec();

    if (!deletedCategory) {
      throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id} để xóa`);
    }

    return {
      statusCode: 200,
      message: 'Xóa danh mục thành công',
      deletedId: id
    };
  }
}