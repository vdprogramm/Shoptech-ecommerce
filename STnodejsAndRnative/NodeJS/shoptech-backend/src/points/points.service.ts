import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { PointTransaction } from './schemas/point-transaction.schema';
import { Order } from '../orders/schemas/order.schema';

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PointTransaction.name) private txModel: Model<PointTransaction>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  // Lấy số điểm hiện tại của user
  async getUserPoints(userId: string) {
    const user = await this.userModel.findById(userId).select('loyaltyPoints');
    return { points: user?.loyaltyPoints || 0 };
  }

  // Cộng điểm khi hoàn thành đơn hàng
  async rewardPointsForOrder(userId: string, orderId: string, orderTotal: number) {
    const earnedPoints = Math.floor(orderTotal / 100000); // 100k = 1 điểm F
    if (earnedPoints <= 0) return;

    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { loyaltyPoints: earnedPoints },
    });

    await this.txModel.create({
      user: new Types.ObjectId(userId),
      amount: earnedPoints,
      type: 'EARN',
      description: `Thưởng điểm từ đơn hàng #${orderId}`,
      order: new Types.ObjectId(orderId),
    });
  }

  // Trừ điểm khi thanh toán đơn hàng
  async redeemPoints(userId: string, pointsToUse: number, orderId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || user.loyaltyPoints < pointsToUse) {
      throw new BadRequestException('Số điểm tích lũy không đủ');
    }

    user.loyaltyPoints -= pointsToUse;
    await user.save();

    await this.txModel.create({
      user: new Types.ObjectId(userId),
      amount: -pointsToUse,
      type: 'REDEEM',
      description: `Sử dụng điểm cho đơn hàng #${orderId}`,
      order: new Types.ObjectId(orderId),
    });
  }

  async rewardPointsForOldOrders() {
    // Tìm tất cả các order có chứa subOrder đã Delivered nhưng chưa từng được cộng điểm trước đó
    const orders = await this.orderModel.find({
      'subOrders.status': 'Delivered'
    }).exec();

    let count = 0;
    for (const order of orders) {
      for (const subOrder of order.subOrders) {
        if (subOrder.status === 'Delivered') {
          // Gọi lại hàm cộng điểm có sẵn của bạn
          await this.rewardPointsForOrder(
            order.user.toString(),
            subOrder._id!.toString(),
            subOrder.grandTotal
          );
          count++;
        }
      }
    }
    return { message: `Đã quét và bù đắp điểm thành công cho ${count} đơn hàng cũ!` };
  }
}