import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { News } from './schemas/news.schema';

@Injectable()
export class NewsService {
  constructor(@InjectModel(News.name) private newsModel: Model<News>) {}

  // Lấy danh sách tin tức
  async findAll() {
    return this.newsModel.find({ isActive: true }).sort({ createdAt: -1 }).exec();
  }

  // Lấy chi tiết 1 tin tức theo ID
  async findOne(id: string) {
    const news = await this.newsModel.findById(id).exec();
    if (!news) {
      throw new NotFoundException('Không tìm thấy tin tức!');
    }
    return news;
  }

  // Tạo mới
  async create(createNewsDto: any) {
    return this.newsModel.create(createNewsDto);
  }

  // Cập nhật tin tức
  async update(id: string, updateNewsDto: any) {
    const updatedNews = await this.newsModel.findByIdAndUpdate(
      id,
      updateNewsDto,
      { new: true } // Trả về dữ liệu mới sau khi update
    ).exec();

    if (!updatedNews) {
      throw new NotFoundException('Không tìm thấy tin tức để cập nhật!');
    }
    return updatedNews;
  }

  // Xóa tin tức (Xóa cứng khỏi database)
  // Nếu muốn xóa mềm (chỉ ẩn đi), bạn có thể đổi thành: return this.update(id, { isActive: false });
  async remove(id: string) {
    const deletedNews = await this.newsModel.findByIdAndDelete(id).exec();
    if (!deletedNews) {
      throw new NotFoundException('Không tìm thấy tin tức để xóa!');
    }
    return deletedNews;
  }
}