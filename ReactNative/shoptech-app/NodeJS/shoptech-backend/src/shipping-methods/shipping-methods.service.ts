import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShippingMethod } from './schemas/shipping-method.schema';

@Injectable()
export class ShippingMethodsService {
  constructor(@InjectModel(ShippingMethod.name) private shippingModel: Model<ShippingMethod>) {}

  // ADMIN TẠO ĐƠN VỊ VẬN CHUYỂN
  async create(data: any) {
    return this.shippingModel.create(data);
  }

  // KHÁCH HÀNG LẤY DANH SÁCH ĐỂ CHỌN LÚC ĐẶT HÀNG (Chỉ lấy cái đang Active)
  async getActiveMethods() {
    return this.shippingModel.find({ isActive: true }).sort({ baseFee: 1 }).exec();
  }

  // ADMIN CẬP NHẬT GIÁ HOẶC TRẠNG THÁI
  async update(id: string, updateData: any) {
    const updated = await this.shippingModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) throw new NotFoundException('Không tìm thấy đơn vị vận chuyển này');
    return updated;
  }
}