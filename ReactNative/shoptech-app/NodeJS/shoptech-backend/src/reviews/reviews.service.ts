import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './schemas/review.schema';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import mongoose from 'mongoose';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

async addReview(userId: string, productId: string, rating: number, comment: string) {
    // 1. CHỐNG FAKE REVIEW: Lấy toàn bộ lịch sử đơn hàng của User
    const userOrders = await this.ordersService.findAllByUser(userId);

    const hasBought = userOrders.some(order =>
      order.subOrders && order.subOrders.some(subOrder =>
        subOrder.status === 'Delivered' &&
        subOrder.items.some(item => {
          const itemProductId = item.product?._id ? item.product._id.toString() : item.product?.toString();
          return itemProductId === productId;
        })
      )
    );

    if (!hasBought) {
      throw new BadRequestException('Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng chứa sản phẩm đó của shop đã được giao thành công.');
    }

    // 2. CHỐNG SPAM: Mỗi người chỉ được review 1 lần cho 1 sản phẩm
    const existingReview = await this.reviewModel.findOne({ user: userId, product: productId });
    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi.');
    }

    // Tìm sản phẩm để lấy ID cửa hàng (store)
    const productInfo = await this.productsService.findOne(productId); // Đổi tên hàm getProductById theo đúng tên hàm trong ProductsService của bạn

    if (!productInfo || !productInfo.store) {
      throw new BadRequestException('Không tìm thấy thông tin cửa hàng của sản phẩm này.');
    }

    // 3. Lưu đánh giá vào Database (Đã bổ sung trường store)
    const newReview = await this.reviewModel.create({
      user: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(productId),
      store: new mongoose.Types.ObjectId(productInfo.store.toString()),
      rating,
      comment
    });

    // 4. TÍNH TOÁN LẠI ĐIỂM TRUNG BÌNH CỦA SẢN PHẨM
    await this.updateProductAverageRating(productId);

    // 5. GỬI MAIL CẢM ƠN KHÁCH HÀNG
    try {
      const user = await this.usersService.findById(userId);
      if (user && user.email) {
        this.mailService.sendReviewThankYouMail(
          user.email,
          user.fullName || 'Quý khách',
          productInfo.name || 'sản phẩm'
        ).catch(err => console.error('Lỗi gửi mail cảm ơn đánh giá:', err));
      }
    } catch (error) {
      console.error('Không thể lấy thông tin người dùng để gửi mail:', error);
    }

    return newReview;
  }

  // Logic tính sao trung bình bằng Aggregation (MongoDB)
  private async updateProductAverageRating(productId: string) {
    const stats = await this.reviewModel.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await this.productsService.updateRating(
        productId,
        Math.round(stats[0].averageRating * 10) / 10, // Làm tròn 1 chữ số thập phân (vd: 4.5)
        stats[0].reviewCount
      );
    } else {
      // Trường hợp hiếm gặp nếu xóa hết review, đưa chỉ số về mặc định
      await this.productsService.updateRating(productId, 0, 0);
    }
  }

  // Lấy danh sách review của 1 sản phẩm (cho khách vãng lai xem trên ứng dụng di động / web)
  async getReviewsByProduct(productId: string) {
    return this.reviewModel
      .find({ product: new mongoose.Types.ObjectId(productId) })
      .populate('user', 'fullName avatar')
      .sort({ createdAt: -1 }) // Đẩy đánh giá mới nhất lên đầu danh sách
      .exec();
  }

  async getReviewCount(productId: string): Promise<number> {
    return await this.reviewModel.countDocuments({ product: new mongoose.Types.ObjectId(productId) });
  }

  async updateReview(reviewId: string, userId: string, rating: number, comment: string) {
    // Tìm đánh giá và kiểm tra quyền sở hữu
    const review = await this.reviewModel.findOne({ _id: reviewId, user: userId });
    if (!review) throw new BadRequestException('Không tìm thấy đánh giá hoặc bạn không có quyền sửa.');

    review.rating = rating;
    review.comment = comment;
    await review.save();

    // Sau khi sửa, phải cập nhật lại điểm trung bình cho sản phẩm
    await this.updateProductAverageRating(review.product.toString());
    return review;
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.reviewModel.findOne({ _id: reviewId, user: userId });
    if (!review) throw new BadRequestException('Không tìm thấy đánh giá hoặc bạn không có quyền xóa.');

    const productId = review.product.toString();
    await this.reviewModel.deleteOne({ _id: reviewId });

    // Sau khi xóa, phải cập nhật lại điểm trung bình cho sản phẩm
    await this.updateProductAverageRating(productId);
    return { message: 'Đã xóa đánh giá thành công' };
  }

async getAllReviewsForAdmin() {
    return this.reviewModel
      .find()
      .populate('user', 'fullName email avatar') // Lấy thông tin người dùng
      .populate({
        path: 'product',
        select: 'name thumbnail store', // Lấy tên, ảnh và id cửa hàng của sản phẩm
        populate: {
          path: 'store', // Tên field liên kết đến bảng Store/Shop trong Product schema (nếu là 'shop' thì đổi thành 'shop')
          select: 'name',   // Lấy tên cửa hàng
        },
      })
      .sort({ createdAt: -1 })                   // Đánh giá mới nhất lên đầu
      .exec();
  }
}