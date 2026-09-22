import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Warranty } from './schemas/warranty.schema';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';

@Injectable()
export class WarrantiesService {
  constructor(
    @InjectModel(Warranty.name) private warrantyModel: Model<Warranty>,
  ) {}

  // 1. Dùng cho Admin tạo thủ công (khớp với CreateWarrantyDto)
  async create(createDto: CreateWarrantyDto) {
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(startDate);

    // Tính toán ngày kết thúc dựa trên durationMonths
    endDate.setMonth(endDate.getMonth() + createDto.durationMonths);

    return await this.warrantyModel.create({
      user: createDto.userId,
      order: createDto.orderId,
      product: createDto.productId,
      startDate: startDate,
      endDate: endDate,
    });
  }

  // 2. User tra cứu bảo hành của chính mình
  async getMyWarranties(userId: string) {
    return await this.warrantyModel
      .find({ user: userId })
      .populate('product', 'name') // Lấy tên sản phẩm từ collection Product
      .populate('order', 'orderCode') // Tùy chọn: Lấy mã đơn hàng
      .sort({ createdAt: -1 })
      .exec();
  }

  // 3. Admin sửa phiếu bảo hành (ví dụ: gia hạn thêm)
  async update(id: string, updateDto: UpdateWarrantyDto) {
    const updated = await this.warrantyModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy phiếu bảo hành này');
    }
    return updated;
  }

  // 4. Admin xóa phiếu bảo hành
  async remove(id: string) {
    const deleted = await this.warrantyModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Không tìm thấy phiếu bảo hành để xóa');
    }
    return { message: 'Đã xóa bảo hành thành công' };
  }

  async findAll() {
      return await this.warrantyModel.find().populate('product user order').exec();
    }

    // 6. Lấy bảo hành cho Merchant (Endpoint: GET /warranties/merchant)
    // Lưu ý: Nếu Merchant cần lọc, bạn có thể truyền storeId vào đây sau này
    async getMerchantWarranties() {
      return await this.warrantyModel.find().populate('product user order').exec();
    }
}