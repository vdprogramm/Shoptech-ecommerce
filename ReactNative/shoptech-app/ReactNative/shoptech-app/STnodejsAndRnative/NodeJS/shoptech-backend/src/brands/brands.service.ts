import { Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand } from './schemas/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(@InjectModel(Brand.name) private brandModel: Model<Brand>) {}

  // 1. Thêm thương hiệu mới
  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    const newBrand = new this.brandModel(createBrandDto);
    return newBrand.save();
  }

  // 2. Lấy tất cả thương hiệu
  async findAll(): Promise<Brand[]> {
    return this.brandModel.find().exec();
  }

  // 3. Lấy chi tiết 1 thương hiệu
  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandModel.findById(id).exec();
    if (!brand) {
      throw new NotFoundException('Không tìm thấy thương hiệu này');
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
      try {
        const updatedBrand = await this.brandModel.findByIdAndUpdate(
          id,
          updateBrandDto,
          { new: true, runValidators: true } // new: true để trả về data mới nhất
        ).exec();

        if (!updatedBrand) {
          throw new NotFoundException(`Không tìm thấy thương hiệu với ID: ${id}`);
        }
        return updatedBrand;
      } catch (error) {
        // Bắt lỗi trùng tên (unique: true)
        if (error.code === 11000) {
          throw new BadRequestException('Tên thương hiệu này đã tồn tại, vui lòng chọn tên khác.');
        }
        throw error;
      }
    }

    // 🔥 5. THÊM MỚI: Xóa thương hiệu
    async remove(id: string) {
      const deletedBrand = await this.brandModel.findByIdAndDelete(id).exec();
      if (!deletedBrand) {
        throw new NotFoundException(`Không tìm thấy thương hiệu với ID: ${id} để xóa`);
      }
      return {
        statusCode: 200,
        message: 'Xóa thương hiệu thành công',
        deletedId: id
      };
    }
}