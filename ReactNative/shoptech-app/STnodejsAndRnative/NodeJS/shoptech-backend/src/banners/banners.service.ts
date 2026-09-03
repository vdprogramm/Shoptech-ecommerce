import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner } from './schemas/banner.schema';

@Injectable()
export class BannersService {
  constructor(@InjectModel(Banner.name) private bannerModel: Model<Banner>) {}

  // ADMIN TẠO BANNER
  async create(data: any) {
    return this.bannerModel.create(data);
  }

  // KHÁCH HÀNG XEM BANNER (Chỉ lấy banner đang Active)
async getActiveBanners(position?: string) {
    const query: any = { isActive: true }; // Bắt buộc phải đang bật

    if (position) {
      query.position = position; // Lọc theo vị trí (ví dụ: 'HOME')
    }

    return this.bannerModel.find(query).exec();
  }

  // ADMIN BẬT/TẮT BANNER
  async toggleActive(id: string, isActive: boolean) {
    return this.bannerModel.findByIdAndUpdate(id, { isActive }, { new: true });
  }

  async findAll() {
      // Lấy TOÀN BỘ banner (cả ẩn lẫn hiện)
      // .sort({ createdAt: -1 }) giúp đưa các banner mới tạo lên đầu danh sách
      return this.bannerModel.find().sort({ createdAt: -1 }).exec();
    }

async update(id: string, data: any) {
    // { new: true } để trả về data mới sau khi update
    return this.bannerModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  // ADMIN XÓA BANNER
  async remove(id: string) {
    return this.bannerModel.findByIdAndDelete(id).exec();
  }
}
