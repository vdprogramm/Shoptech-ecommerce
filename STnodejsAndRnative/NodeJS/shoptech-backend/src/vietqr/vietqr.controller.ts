import { Controller, Post, Body, Patch, Param, Get, BadRequestException, Res, Query } from '@nestjs/common';
import { VietqrService } from './vietqr.service';

@Controller('vietqr')
export class VietqrController {
  constructor(private readonly vietqrService: VietqrService) {}

  @Post('generate')
  async generateQrCode(@Body('subOrderId') subOrderId: string) {
    if (!subOrderId) {
      throw new BadRequestException('Vui lòng truyền trường subOrderId trong Body!');
    }
    return await this.vietqrService.createPayosPaymentLink(subOrderId);
  }

  @Patch('simulate-success/:subOrderId')
  async simulateSuccess(@Param('subOrderId') subOrderId: string) {
    const globalPaymentStatus = await this.vietqrService.processPaymentSuccess(subOrderId);
    return {
      success: true,
      message: `[Giả lập VietQR] Đơn hàng con ${subOrderId} đã chuyển trạng thái sang 'Paid'!`,
      parentOrderPaymentStatus: globalPaymentStatus,
    };
  }

  // BƯỚC SỬA 2: Xử lý cập nhật Database ngay khi PayOS chuyển hướng về trang này
  @Get('success-page')
  async successPage(@Res() res, @Query() query: any) {
    const frontendUrl = 'http://localhost:8080/payment-result';

    // 1. Lấy mã subOrderId từ URL mà ta đã nhét vào ở Bước 1
    const subOrderId = query.subOrderId;

    // 2. PayOS trả về code = '00' (hoặc status = 'PAID') nghĩa là khách đã chuyển khoản thành công
    const isSuccess = query.code === '00' || query.status === 'PAID';

    if (isSuccess && subOrderId) {
      try {
        // Gọi hàm update DB từ Service
        await this.vietqrService.processPaymentSuccess(subOrderId);
      } catch (error) {
        console.error('Lỗi khi cập nhật thanh toán VietQR:', error);
      }
    }

    // 3. Sau khi xử lý DB xong, mới đẩy người dùng về Frontend
    return res.redirect(`${frontendUrl}?vnp_ResponseCode=${isSuccess ? '00' : '99'}&method=payos`);
  }

  @Get('cancel-page')
  cancelPage(@Res() res, @Query() query: any) {
    const frontendUrl = 'http://localhost:8080/payment-result';
    return res.redirect(`${frontendUrl}?vnp_ResponseCode=99&method=payos`);
  }
}