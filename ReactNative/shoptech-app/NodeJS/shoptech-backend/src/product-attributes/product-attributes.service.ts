import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductAttribute } from './schemas/product-attribute.schema';

@Injectable()
export class ProductAttributesService {
  constructor(
    @InjectModel(ProductAttribute.name) private attrModel: Model<ProductAttribute>,
  ) {}

  // 1. ADMIN CẬP NHẬT TOÀN BỘ THÔNG SỐ (Xóa cũ, Thêm mới)
  async upsertAttributes(productId: string, attributes: { key: string; value: string }[]) {
    // Bước A: Xóa toàn bộ thông số cũ của sản phẩm này
    await this.attrModel.deleteMany({ product: productId });

    // Bước B: Thêm danh sách thông số mới
    const newAttributes = attributes.map((attr) => ({
      product: productId,
      key: attr.key,
      value: attr.value,
    }));

    return this.attrModel.insertMany(newAttributes);
  }

  // 2. LẤY BẢNG THÔNG SỐ KỸ THUẬT CỦA 1 SẢN PHẨM (Cho trang Chi tiết SP)
  async getAttributesByProduct(productId: string) {
    return this.attrModel.find({ product: productId }).select('key value -_id').exec();
  }

  // 3. TÍNH NĂNG NÂNG CAO: LỌC SẢN PHẨM THEO THÔNG SỐ (VD: Lọc máy RAM 16GB)
  // Tham số truyền vào dạng: { "RAM": "16GB", "CPU": "M3" }
  async filterProductsByAttributes(filters: Record<string, string>) {
    const conditions = Object.keys(filters).map((key) => ({
      key: key,
      value: filters[key],
    }));

    // Tìm những sản phẩm khớp với tất cả các điều kiện lọc
    // (Đoạn này dùng logic lấy ra danh sách các productId khớp)
    const matches = await this.attrModel.find({ $or: conditions }).select('product').exec();

    // Lọc ra các ID duy nhất
    const productIds = [...new Set(matches.map(m => m.product.toString()))];
    return productIds;
  }

  async deleteAttributes(productId: string) {
    return await this.attrModel.deleteMany({ product: productId });
  }
}