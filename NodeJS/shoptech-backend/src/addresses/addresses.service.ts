import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Address } from './schemas/address.schema';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(@InjectModel(Address.name) private addressModel: Model<Address>) {}

  // 1. THÊM ĐỊA CHỈ MỚI
  async create(userId: string, createAddressDto: CreateAddressDto) {
    // Nếu user chọn đây là địa chỉ mặc định -> Phải gỡ mặc định của các địa chỉ cũ
    if (createAddressDto.isDefault) {
      await this.addressModel.updateMany(
        { user: userId },
        { $set: { isDefault: false } }
      );
    }

    // Nếu đây là địa chỉ đầu tiên của user -> Tự động ép thành mặc định
    const count = await this.addressModel.countDocuments({ user: userId });
    if (count === 0) {
      createAddressDto.isDefault = true;
    }

    const newAddress = new this.addressModel({
      ...createAddressDto,
      user: userId,
    });
    return newAddress.save();
  }

  // 2. LẤY DANH SÁCH ĐỊA CHỈ CỦA 1 USER
  async findAllByUser(userId: string) {
    // Sắp xếp để địa chỉ Mặc định (isDefault: true) luôn nổi lên đầu danh sách
    return this.addressModel.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 }).exec();
  }

  // 3. SET MỘT ĐỊA CHỈ LÀM MẶC ĐỊNH
  async setDefault(userId: string, addressId: string) {
    const address = await this.addressModel.findOne({ _id: addressId, user: userId });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ này');

    // Bước A: Reset tất cả địa chỉ của user này về false
    await this.addressModel.updateMany(
      { user: userId },
      { $set: { isDefault: false } }
    );

    // Bước B: Bật true cho địa chỉ được chọn
    address.isDefault = true;
    return address.save();
  }

  // 4. XÓA ĐỊA CHỈ
  async remove(userId: string, addressId: string) {
    const result = await this.addressModel.findOneAndDelete({ _id: addressId, user: userId });
    if (!result) throw new NotFoundException('Không tìm thấy địa chỉ để xóa');
    return { message: 'Đã xóa địa chỉ thành công' };
  }

  // 5. CẬP NHẬT ĐỊA CHỈ
  async update(userId: string, addressId: string, updateData: Partial<CreateAddressDto>) {
    const address = await this.addressModel.findOne({ _id: addressId, user: userId });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ để cập nhật');

    // Nếu cập nhật thành mặc định -> Phải gỡ mặc định các địa chỉ khác
    if (updateData.isDefault) {
      await this.addressModel.updateMany(
        { user: userId, _id: { $ne: addressId } },
        { $set: { isDefault: false } }
      );
    }

    Object.assign(address, updateData);
    return address.save();
  }
}