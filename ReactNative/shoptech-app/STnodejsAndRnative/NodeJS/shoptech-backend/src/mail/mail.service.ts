import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 2525,
      secure: false,
      auth: {
        user: 'b6ec18001@smtp-brevo.com',
        pass: process.env.BREVO_SMTP_PASS,
      },
    } as any); // Thêm 'as any' để vượt qua lỗi kiểm tra kiểu của NestJS
  }

  async sendVerificationOtp(toEmail: string, otp: string) {
    const mailOptions = {
      from: '"ShopTech Hệ Thống" <vinhdinhcute@gmail.com>',
      to: toEmail,
      subject: 'Mã xác thực tài khoản ShopTech',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #0056b3;">Chào mừng bạn đến với ShopTech!</h2>
          <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất, vui lòng nhập mã xác thực gồm 6 chữ số bên dưới:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>Mã này sẽ hết hạn trong vòng 15 phút.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        </div>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendResetPasswordEmail(toEmail: string, fullName: string, resetUrl: string) {
    const mailOptions = {
      from: '"ShopTech Hệ Thống" <vinhdinhcute@gmail.com>',
      to: toEmail,
      subject: '🔒 Yêu cầu khôi phục mật khẩu tài khoản ShopTech',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 520px; margin: 0 auto; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #e11d48; margin: 0; font-size: 22px;">Khôi phục mật khẩu ShopTech</h2>
          </div>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ShopTech liên kết với email của bạn.</p>
          <p>Vui lòng bấm vào nút bấm bảo mật bên dưới để tiến hành tạo mật khẩu mới:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" target="_blank" style="background-color: #e11d48; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(225, 29, 72, 0.2);">
              Đặt Lại Mật Khẩu
            </a>
          </div>
          <p style="font-size: 12px; color: #666; background-color: #f9fafb; padding: 10px; border-radius: 6px; border-left: 3px solid #e11d48;">
            ⚠️ <strong>Lưu ý quan trọng:</strong> Đường dẫn này chỉ có hiệu lực trong vòng <strong>15 phút</strong>.
          </p>
        </div>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendOrderSuccessMail(toEmail: string, fullName: string, orderCode: string, totalAmount: number) {
    const mailOptions = {
      from: '"ShopTech Hệ Thống" <vinhdinhcute@gmail.com>',
      to: toEmail,
      subject: `🎉 Xác nhận đặt hàng thành công - Mã đơn #${orderCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
          <h2 style="color: #ee4d2d; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 10px;">SHOPTECH</h2>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Cảm ơn bạn đã mua sắm tại ShopTech. Đơn hàng của bạn đã được hệ thống ghi nhận và đang chờ xử lý.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> <span style="color: #ee4d2d;">#${orderCode}</span></p>
            <p style="margin: 5px 0;"><strong>Tổng thanh toán:</strong> ${totalAmount.toLocaleString('vi-VN')} VNĐ</p>
          </div>
        </div>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendDeliverySuccessMail(toEmail: string, fullName: string, orderCode: string) {
    const timeNow = new Date().toLocaleString('vi-VN');
    const mailOptions = {
      from: '"ShopTech Hệ Thống" <vinhdinhcute@gmail.com>',
      to: toEmail,
      subject: `✅ Đơn hàng #${orderCode} đã giao hàng thành công`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
          <h2 style="color: #28a745; text-align: center;">GIAO HÀNG THÀNH CÔNG</h2>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Đơn hàng <strong>#${orderCode}</strong> của bạn đã được shipper giao thành công vào lúc <strong>${timeNow}</strong>.</p>
        </div>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendOrderCancelledMail(toEmail: string, fullName: string, orderCode: string, reason: string) {
    const mailOptions = {
      from: '"ShopTech Hệ Thống" <vinhdinhcute@gmail.com>',
      to: toEmail,
      subject: `❌ Đơn hàng #${orderCode} đã bị hủy`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
          <h2 style="color: #dc3545; text-align: center;">ĐƠN HÀNG ĐÃ BỊ HỦY</h2>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Rất tiếc phải thông báo rằng đơn hàng <strong>#${orderCode}</strong> của bạn đã bị hủy.</p>
          <p><strong>Lý do:</strong> ${reason}</p>
        </div>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendReviewThankYouMail(toEmail: string, fullName: string, productName: string) {
    const mailOptions = {
      from: '"ShopTech Hệ Thống" <vinhdinhcute@gmail.com>',
      to: toEmail,
      subject: `Cảm ơn bạn đã đánh giá sản phẩm ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
          <h2 style="color: #ee4d2d; text-align: center;">CẢM ƠN BẠN ĐÃ ĐÁNH GIÁ</h2>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Cảm ơn bạn đã dành thời gian đánh giá sản phẩm <strong>${productName}</strong> trên ShopTech.</p>
          <p>Đánh giá của bạn rất quan trọng để giúp chúng tôi và các khách hàng khác có thêm thông tin hữu ích.</p>
          <p>Chúc bạn có những trải nghiệm mua sắm tuyệt vời tiếp theo tại ShopTech!</p>
        </div>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }
}