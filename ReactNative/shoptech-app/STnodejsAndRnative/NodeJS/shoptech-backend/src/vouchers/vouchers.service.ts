import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Voucher } from './schemas/voucher.schema';

@Injectable()
export class VouchersService {
  constructor(@InjectModel(Voucher.name) private voucherModel: Model<Voucher>) {}

  // 1. ADMIN TẠO MÃ MỚI
  async createVoucher(data: any) {
    const existing = await this.voucherModel.findOne({ code: data.code.toUpperCase() });
    if (existing) throw new BadRequestException('Mã giảm giá này đã tồn tại');

    return this.voucherModel.create({ ...data, code: data.code.toUpperCase() });
  }

  // 2. LOGIC KIỂM TRA MÃ HỢP LỆ (Dành cho lúc khách hàng ấn "Áp dụng")
  async validateVoucher(code: string, orderTotal: number, storeSubtotals?: Record<string, number>) {
    const voucher = await this.voucherModel.findOne({ code: code.toUpperCase() });

    if (!voucher) throw new NotFoundException('Mã giảm giá không tồn tại');
    if (!voucher.isActive) throw new BadRequestException('Mã giảm giá đã bị vô hiệu hóa');
    if (new Date() > voucher.expirationDate) throw new BadRequestException('Mã giảm giá đã hết hạn');
    if (voucher.usedCount >= voucher.usageLimit) throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');

    let applicableTotal = orderTotal;

    // Nếu voucher có giới hạn store, và có truyền storeSubtotals (từ frontend)
    if (voucher.store && storeSubtotals) {
      const storeIdStr = voucher.store.toString();
      if (!storeSubtotals[storeIdStr]) {
        throw new BadRequestException('Mã giảm giá này chỉ áp dụng cho sản phẩm của gian hàng tương ứng');
      }
      applicableTotal = storeSubtotals[storeIdStr];
    }

    if (applicableTotal < voucher.minOrderValue) {
      throw new BadRequestException(`Đơn hàng của gian hàng/hệ thống phải từ ${voucher.minOrderValue.toLocaleString()}đ để áp dụng mã này`);
    }

    // Tính toán số tiền được giảm
    let discountValue = 0;
    if (voucher.discountType === 'percent') {
      discountValue = (applicableTotal * voucher.discountAmount) / 100;
    } else {
      discountValue = voucher.discountAmount;
    }

    // Đảm bảo không giảm giá âm tiền đơn hàng
    if (discountValue > applicableTotal) discountValue = applicableTotal;

    return {
      isValid: true,
      voucherId: voucher._id,
      code: voucher.code,
      store: voucher.store,
      discountValue,
      finalTotal: orderTotal - discountValue
    };
  }

  // 3. TĂNG SỐ LƯỢT ĐÃ DÙNG (Gọi khi đơn hàng thanh toán thành công)
  async incrementUsedCount(voucherId: string) {
    await this.voucherModel.findByIdAndUpdate(voucherId, { $inc: { usedCount: 1 } });
  }

  // 4. ADMIN/MERCHANT LẤY TOÀN BỘ DANH SÁCH (Xem cả mã ẩn/mã lỗi)
  async getAllVouchers() {
    return this.voucherModel.find().sort({ createdAt: -1 });
  }

  // ==================== HÀM CẬP NHẬT MỚI TOÀN DIỆN CHO KHÁCH HÀNG ====================
  // 5. KHÁCH HÀNG LẤY DANH SÁCH VOUCHER KHẢ DỤNG TRÊN CỬA HÀNG
  async getPublicVouchers() {
    const now = new Date();

    // Thực hiện lọc dữ liệu ngay tại database bằng Mongoose Query để tối ưu hiệu năng
    return this.voucherModel.find({
      isActive: true,                     // Mã phải đang bật công khai
      expirationDate: { $gt: now },       // Hạn dùng phải lớn hơn thời gian hiện tại
      $expr: { $lt: ['$usedCount', '$usageLimit'] } // Số lượt đã dùng phải nhỏ hơn giới hạn cho phép
    })
    .select('code discountAmount discountType minOrderValue expirationDate description store') // Không trả về các trường bảo mật/nội bộ
    .sort({ minOrderValue: 1 }); // Sắp xếp theo giá trị đơn hàng tối thiểu tăng dần để người dùng dễ quan sát
  }

  async deleteVoucher(id: string) {
      const deletedVoucher = await this.voucherModel.findByIdAndDelete(id);

      if (!deletedVoucher) {
        throw new NotFoundException('Không tìm thấy mã giảm giá này để xóa');
      }

      return { message: 'Đã xóa mã giảm giá thành công' };
    }
}