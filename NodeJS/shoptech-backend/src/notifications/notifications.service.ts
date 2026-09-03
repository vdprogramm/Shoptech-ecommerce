import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notiModel: Model<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  // Hàm "2 trong 1": Vừa lưu vừa bắn real-time
  async createAndSend(userId: string, title: string, message: string, orderId?: string) {
    // 1. Lưu vào Database
    const newNoti = await this.notiModel.create({
      user: userId,
      title,
      message,
      orderId,
    });

    // 2. Bắn qua Socket (Real-time)
   this.gateway.sendToUser(userId, 'notification', newNoti);
    return newNoti;
  }

  // Lấy lịch sử thông báo cho khách hàng
  async getMyNotifications(userId: string) {
    return this.notiModel.find({ user: userId }).sort({ createdAt: -1 }).limit(20);
  }

  // Đánh giá đã đọc
  async markAsRead(notificationId: string) {
    return this.notiModel.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  }
}