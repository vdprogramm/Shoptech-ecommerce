import { Controller, Get, Query, Req, Res, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import mongoose from 'mongoose';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  private async findOrderSafely(txnRef: string) {
    if (!txnRef) return null;
    console.log(`🔍 [DEBUG] Đang dò tìm đơn hàng với txnRef: ${txnRef}`);

    // 1. Thử tìm theo orderCode (VD: ORD123456)
    const orderByCode = await this.ordersService.findByOrderCode(txnRef).catch(() => null);
    if (orderByCode) {
      console.log(`✅ [DEBUG] Tìm thấy qua orderCode: ${orderByCode._id}`);
      return orderByCode;
    }

    // 2. Nếu txnRef là định dạng ObjectId hợp lệ của MongoDB (24 ký tự)
    if (txnRef.length === 24 && mongoose.Types.ObjectId.isValid(txnRef)) {
      // Thử tìm theo _id đơn hàng cha (Parent Order)
      const orderById = await this.ordersService.findOne(txnRef).catch(() => null);
      if (orderById) {
        console.log(`✅ [DEBUG] Tìm thấy qua Parent _id: ${orderById._id}`);
        return orderById;
      }

      // Thử tìm bọc lót trong mảng subOrders nếu App lỡ truyền subOrderId lên
      const subOrderMatch = await this.ordersService['orderModel'].findOne({
        'subOrders._id': new mongoose.Types.ObjectId(txnRef)
      }).exec().catch(() => null);

      if (subOrderMatch) {
        console.log(`✅ [DEBUG] Tìm thấy qua SubOrder _id thuộc Parent: ${subOrderMatch._id}`);
        return subOrderMatch;
      }
    }

    console.log(`❌ [DEBUG] HOÀN TOÀN KHÔNG TÌM THẤY đơn hàng với txnRef: ${txnRef}`);
    return null;
  }

  @Post('create-url')
  createUrl(@Query('orderId') orderId: string, @Query('amount') amount: number, @Req() req) {
    console.log(`🚀 [DEBUG] Tạo URL thanh toán cho ID: ${orderId}, Amount: ${amount}`);
    const ip = req.ip || '127.0.0.1';
    const url = this.paymentsService.createPaymentUrl(orderId, amount, ip);
    return { url };
  }

  @Get('vnpay_ipn')
  async vnpayIpn(@Query() query: any, @Res() res) {
    console.log('📌 VNPAY IPN Callback received:', query);

    try {
      const order = await this.findOrderSafely(query['vnp_TxnRef']);
      if (!order) {
        return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }

      if (query['vnp_ResponseCode'] === '00') {
        if (order.paymentStatus === 'Unpaid') {
          await this.ordersService.updatePaymentStatus(order._id.toString(), 'Paid');
          console.log(`✅ [IPN] Đã cập nhật PAID thành công cho đơn: ${order._id}`);
        }
      } else {
        await this.ordersService.updatePaymentStatus(order._id.toString(), 'Failed');
      }

      return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });
    } catch (error) {
      console.error('❌ [IPN] Lỗi hệ thống:', error);
      return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  @Get('vnpay_return')
  async vnpayReturn(@Query() query: any, @Res() res) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://shoptech-ecommerce.vercel.app/payment-result';
    console.log('📌 VNPAY Return Callback received:', query);


    try {
      const order = await this.findOrderSafely(query['vnp_TxnRef']);
      if (order && query['vnp_ResponseCode'] === '00') {
        if (order.paymentStatus === 'Unpaid') {
          await this.ordersService.updatePaymentStatus(order._id.toString(), 'Paid');
          console.log(`🎉 [Return] Đã update PAID cho đơn: ${order._id}`);
        } else {
          console.log(`⚠️ Đơn hàng đã ở trạng thái: ${order.paymentStatus}`);
        }
      }
    } catch (error) {
      console.error('❌ [Return] Lỗi hệ thống khi update:', error);
    }

    const searchParams = new URLSearchParams(query).toString();
    return res.redirect(`${frontendUrl}?${searchParams}`);
  }
}