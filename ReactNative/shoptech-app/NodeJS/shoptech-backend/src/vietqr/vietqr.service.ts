import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../orders/schemas/order.schema';

@Injectable()
export class VietqrService {
  private payos: any;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {
    try {
      const payosLib = require('@payos/node');
      const PayOSConstructor = payosLib.PayOS || payosLib.default || payosLib;

      this.payos = new PayOSConstructor(
        process.env.PAYOS_CLIENT_ID,
        process.env.PAYOS_API_KEY,
        process.env.PAYOS_CHECKSUM_KEY
      );
    } catch (e) {
      console.error('Lỗi nghiêm trọng khi nạp cấu hình SDK PayOS:', e);
    }
  }

  // 1. Tạo Link Thanh Toán Động qua PayOS SDK
  async createPayosPaymentLink(subOrderId: string) {
    const order = await this.orderModel.findOne({
      'subOrders._id': new Types.ObjectId(subOrderId),
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng chứa mã subOrderId này');
    }

    const subOrder = order.subOrders.find(sub => sub?._id?.toString() === subOrderId);
    if (!subOrder) {
      throw new NotFoundException('Không tìm thấy chi tiết đơn hàng con trong hệ thống');
    }

    const payosOrderCode = Math.floor(Date.now() % 1000000);
    const description = `Thanh toan don ${subOrderId.substring(subOrderId.length - 6)}`;

const paymentBody: any = {
      orderCode: payosOrderCode,
      amount: subOrder.grandTotal,
      description: description.substring(0, 25),
      items: [
        {
          name: `Don hang con ${subOrderId.substring(subOrderId.length - 6)}`,
          quantity: 1,
          price: subOrder.grandTotal,
        }
      ],
      // Thay dòng returnUrl cũ bằng dòng này:
      returnUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/vietqr/success-page?subOrderId=${subOrderId}`,
      cancelUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/vietqr/cancel-page`,
    };

    if (!this.payos || !this.payos.paymentRequests || typeof this.payos.paymentRequests.create !== 'function') {
      console.error('Cấu trúc SDK không khớp.');
      throw new InternalServerErrorException('Cấu hình cổng thanh toán PayOS bị lỗi khởi tạo hệ thống');
    }

    try {
      const paymentLinkData = await this.payos.paymentRequests.create(paymentBody);

      return {
        subOrderId,
        amount: subOrder.grandTotal,
        payosOrderCode,
        checkoutUrl: paymentLinkData.checkoutUrl,
        qrCode: paymentLinkData.qrCode,
      };
    } catch (error) {
      console.error('Lỗi phản hồi trực tiếp từ cổng PayOS:', error);
      throw new InternalServerErrorException('Không thể kết nối cổng thanh toán PayOS');
    }
  }

  // 2. Cập nhật trạng thái sau khi thanh toán thành công
  async processPaymentSuccess(subOrderId: string) {
    const order = await this.orderModel.findOne({
      'subOrders._id': new Types.ObjectId(subOrderId),
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng con cần thanh toán');
    }

    const subOrderIndex = order.subOrders.findIndex(sub => sub?._id?.toString() === subOrderId);
    if (subOrderIndex === -1) {
      throw new NotFoundException('Không tồn tại đơn hàng con này trong danh sách');
    }

    order.subOrders[subOrderIndex].status = 'Paid';

    const allPaid = order.subOrders.every(sub =>
      ['Paid', 'Processing', 'Shipped', 'Delivered'].includes(sub.status)
    );

    if (allPaid) {
      order.paymentStatus = 'Paid';
    }

    await order.save();
    return order.paymentStatus;
  }
}