import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist } from './schemas/wishlist.schema';

@Injectable()
export class WishlistsService {
  constructor(@InjectModel(Wishlist.name) private wishlistModel: Model<Wishlist>) {}

  // 1. LOGIC THẢ TIM / BỎ THẢ TIM (Toggle)
  async toggleWishlist(userId: string, productId: string) {
    // Tìm xem user đã thả tim sản phẩm này chưa
    const existingItem = await this.wishlistModel.findOne({ user: userId, product: productId });

    if (existingItem) {
      // Nếu có rồi -> Khách muốn BỎ thả tim (Tim rỗng)
      await this.wishlistModel.deleteOne({ _id: existingItem._id });
      return {
        message: 'Đã bỏ yêu thích sản phẩm',
        isLiked: false
      };
    } else {
      // Nếu chưa có -> Khách muốn THÊM yêu thích (Tim đỏ)
      await this.wishlistModel.create({ user: userId, product: productId });
      return {
        message: 'Đã thêm vào danh sách yêu thích',
        isLiked: true
      };
    }
  }

  // 2. LẤY DANH SÁCH YÊU THÍCH CỦA KHÁCH HÀNG
  async getMyWishlist(userId: string) {
    return this.wishlistModel
      .find({ user: userId })
      .populate('product', 'name price images averageRating soldCount store') // Thêm soldCount và store
      .sort({ createdAt: -1 }) // Cái nào mới thả tim thì xếp lên đầu
      .exec();
  }

  async checkIsLiked(userId: string, productId: string): Promise<boolean> {
    const existingItem = await this.wishlistModel.findOne({
      user: userId,
      product: productId
    });
    // Trả về true nếu tìm thấy (đã thích), false nếu không
    return !!existingItem;
  }
}