import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../orders/schemas/order.schema';
import { Product } from '../products/schemas/product.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getGeneralStats() {
    const [totalOrders, totalRevenue, totalProducts, totalUsers] = await Promise.all([
      this.orderModel.countDocuments(),
      this.orderModel.aggregate([
        { $unwind: '$subOrders' },
        { $match: { 'subOrders.status': 'Delivered' } },
        { $group: { _id: null, total: { $sum: '$subOrders.grandTotal' } } }
      ]),
      this.productModel.countDocuments(),
      this.userModel.countDocuments()
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalProducts,
      totalUsers
    };
  }

  async getRevenueByMonth(year: number) {
    return this.orderModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      { $unwind: '$subOrders' },
      { $match: { 'subOrders.status': 'Delivered' } },
      {
        $group: {
          _id: { $month: '$createdAt' },
          monthlyRevenue: { $sum: '$subOrders.grandTotal' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
  }

  /**
   * 🛒 FIX LỖI: Sửa đường dẫn unwind từ '$items' thành '$subOrders.items' cho đúng với Schema phân tách
   */
  async getTopSellingProducts() {
    return this.orderModel.aggregate([
      { $unwind: '$subOrders' },
      { $match: { 'subOrders.status': 'Delivered' } },
      { $unwind: '$subOrders.items' },
      {
        $group: {
          _id: '$subOrders.items.product',
          name: { $first: '$subOrders.items.name' },
          totalSold: { $sum: '$subOrders.items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$subOrders.items.price', '$subOrders.items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
  }

  /**
   * 🚴 BỔ SUNG: THỐNG KÊ THỜI GIAN THỰC CHO APP MOBILE SHIPPER
   * Giúp map chuẩn dữ liệu: Đơn hôm nay, Thu nhập (đ) và Ví tài khoản
   */
  async getShipperStatsToday(shipperId: string) {
    const shipperObjectId = new Types.ObjectId(shipperId);

    // 1. Thiết lập mốc thời gian từ 00:00:00 sáng hôm nay đến 23:59:59 đêm nay theo giờ hệ thống
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Tính toán số đơn hoàn thành và tổng thu nhập (shippingFee) trong ngày hôm nay bằng Aggregate
    const statsToday = await this.orderModel.aggregate([
      { $unwind: '$subOrders' },
      {
        $match: {
          'subOrders.shipperId': shipperObjectId,
          'subOrders.status': 'Delivered', // Chỉ tính đơn giao thành công
          'subOrders.updatedAt': { $gte: startOfToday, $lte: endOfToday } // Thuộc ngày hôm nay
        }
      },
      {
        $group: {
          _id: null,
          todayOrdersCount: { $sum: 1 }, // Đếm số cuốc xe thành công
          todayRevenue: { $sum: '$subOrders.shippingFee' } // Thu nhập tính bằng tổng phí ship thu về
        }
      }
    ]);

    // 3. Truy vấn trực tiếp tài khoản Shipper để lấy số dư ví thực tế (walletBalance)
    const shipperInfo = await this.userModel.findById(shipperId).select('walletBalance').lean();

    return {
      todayOrders: statsToday[0]?.todayOrdersCount || 0,     // Trả về số lượng đơn hôm nay
      todayRevenue: statsToday[0]?.todayRevenue || 0,       // Trả về số tiền thu nhập hôm nay
      walletBalance: shipperInfo?.walletBalance || 0         // Trả về số dư ví tài khoản
    };
  }

  // --- MERCHANT METHODS (GIỮ NGUYÊN) ---

  async getMerchantStats(merchantId: string) {
    const storeObjectId = new Types.ObjectId(merchantId);

    const totalOrders = await this.orderModel.aggregate([
      { $unwind: '$subOrders' },
      { $match: { 'subOrders.store': storeObjectId } },
      { $count: 'count' }
    ]);
    const ordersCount = totalOrders[0]?.count || 0;

    const totalRevenue = await this.orderModel.aggregate([
      { $unwind: '$subOrders' },
      {
        $match: {
          'subOrders.store': storeObjectId,
          'subOrders.status': 'Delivered'
        }
      },
      { $group: { _id: null, total: { $sum: '$subOrders.grandTotal' } } }
    ]);

    const totalProducts = await this.productModel.countDocuments({ store: storeObjectId });

    return {
      totalOrders: ordersCount,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalProducts
    };
  }

  async getMerchantRevenueByMonth(merchantId: string, year: number) {
    const storeObjectId = new Types.ObjectId(merchantId);
    return this.orderModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      { $unwind: '$subOrders' },
      {
        $match: {
          'subOrders.store': storeObjectId,
          'subOrders.status': 'Delivered'
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          monthlyRevenue: { $sum: '$subOrders.grandTotal' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
  }

  async getMerchantTopSellingProducts(merchantId: string) {
    const storeObjectId = new Types.ObjectId(merchantId);
    return this.orderModel.aggregate([
      { $unwind: '$subOrders' },
      {
        $match: {
          'subOrders.store': storeObjectId,
          'subOrders.status': 'Delivered'
        }
      },
      { $unwind: '$subOrders.items' },
      {
        $group: {
          _id: '$subOrders.items.product',
          name: { $first: '$subOrders.items.name' },
          totalSold: { $sum: '$subOrders.items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$subOrders.items.price', '$subOrders.items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
  }
}