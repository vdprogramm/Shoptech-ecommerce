import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Store, StoreDocument } from './schemas/store.schema';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User} from '../users/schemas/user.schema'; // 🟢 Import Schema User để ép kiểu dữ liệu

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<StoreDocument>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  // Hàm tiện ích kiểm tra tính hợp lệ của định dạng chuỗi Hex 24 ký tự (MongoDB ObjectId)
  private validateObjectId(id: string, fieldName: string = 'ID') {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`${fieldName} không đúng định dạng mã chuỗi 24 ký tự Hex của MongoDB.`);
    }
  }

  // 1. Tạo mới một cửa hàng và tự động cập nhật liên kết chéo với User
  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    // Bảo vệ: Kiểm tra managerId trước khi ép kiểu
    this.validateObjectId(createStoreDto.managerId, 'Mã người quản lý (managerId)');

    // a. Khởi tạo và lưu Cửa hàng mới vào database
    const createdStore = new this.storeModel({
      ...createStoreDto,
      managerId: new Types.ObjectId(createStoreDto.managerId),
    });
    const savedStore = await createdStore.save();

    // b. 🔥 CẬP NHẬT NGƯỢC (Inverse Update): Tìm người quản lý và gán storeId ngay lập tức
    await this.userModel.findByIdAndUpdate(
      createStoreDto.managerId,
      { $set: { storeId: savedStore._id } }, // Đập thẳng _id của Store vừa sinh ra vào tài khoản Owner
      { new: true }
    );

    return savedStore;
  }

  // 2. Lấy danh sách tất cả cửa hàng (Dành cho Admin)
  async findAll(): Promise<Store[]> {
    return this.storeModel.find().sort({ createdAt: -1 }).exec();
  }

  // 3. Lấy thông tin chi tiết một cửa hàng
  async findOne(id: string): Promise<Store> {
    this.validateObjectId(id, 'Mã cửa hàng (Store ID)');

    const store = await this.storeModel.findById(id).exec();
    if (!store) {
      throw new NotFoundException(`Cửa hàng với ID [${id}] không tồn tại.`);
    }
    return store;
  }

  // 4. Tìm kiếm cửa hàng theo ID của người quản lý (Phục vụ phân quyền role STORE)
  async findByManager(managerId: string): Promise<Store[]> {
    this.validateObjectId(managerId, 'Mã người quản lý (managerId)');

    return this.storeModel
      .find({ managerId: new Types.ObjectId(managerId) })
      .exec();
  }

  // 5. Cập nhật thông tin cửa hàng
  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    this.validateObjectId(id, 'Mã cửa hàng cần cập nhật (Store ID)');

    const updateData: any = { ...updateStoreDto };

    if (updateStoreDto.managerId) {
      this.validateObjectId(updateStoreDto.managerId, 'Mã người quản lý mới (managerId)');
      updateData.managerId = new Types.ObjectId(updateStoreDto.managerId);
    } else {
      delete updateData.managerId;
    }

    const updatedStore = await this.storeModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .exec();

    if (!updatedStore) {
      throw new NotFoundException(`Cửa hàng với ID [${id}] không tồn tại để cập nhật.`);
    }

    return updatedStore;
  }

  // 6. Xóa cửa hàng hệ thống
  async remove(id: string): Promise<{ message: string }> {
    this.validateObjectId(id, 'Mã cửa hàng cần xóa (Store ID)');

    // Trước khi xóa Store, bạn có thể cân nhắc set storeId của User quản lý về null nếu muốn bảo toàn tính toàn vẹn dữ liệu
    const store = await this.storeModel.findById(id).exec();
    if (store && store.managerId) {
      await this.userModel.findByIdAndUpdate(store.managerId, { $set: { storeId: null } });
    }

    const result = await this.storeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Cửa hàng với ID [${id}] không tồn tại.`);
    }
    return { message: 'Xóa cửa hàng thành công.' };
  }
}