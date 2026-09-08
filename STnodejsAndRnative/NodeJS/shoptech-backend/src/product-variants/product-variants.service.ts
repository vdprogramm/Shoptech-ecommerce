import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductVariant } from './schemas/product-variant.schema';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { MovementType } from '../stock-movements/schemas/stock-movement.schema';

@Injectable()
export class ProductVariantsService {
  constructor(@InjectModel(ProductVariant.name) private variantModel: Model<ProductVariant>,
  private stockMovementsService: StockMovementsService,
  ) {}

  // 1. ADMIN TẠO BIẾN THỂ MỚI
  async createVariant(productId: string, data: any) {
    const existingSku = await this.variantModel.findOne({ sku: data.sku.toUpperCase() });
    if (existingSku) {
      throw new BadRequestException(`Mã SKU ${data.sku} đã tồn tại trong hệ thống!`);
    }

    const newVariant = await this.variantModel.create({
      ...data,
      product: productId,
    });
    return newVariant;
  }

  // 2. LẤY TẤT CẢ BIẾN THỂ CỦA 1 SẢN PHẨM (Dùng cho Trang chi tiết SP)
  async getVariantsByProduct(productId: string) {
    return this.variantModel.find({ product: productId }).exec();
  }

  // 3. ADMIN CẬP NHẬT TỒN KHO CHO BIẾN THỂ (Thay thế cho API nhập kho cũ)
  async addVariantStock(variantId: string, quantity: number, adminId: string) {
    const variant = await this.variantModel.findById(variantId);
    if (!variant) throw new NotFoundException('Không tìm thấy biến thể này');

    variant.stock += quantity;
    await variant.save();

    await this.stockMovementsService.recordMovement(
          variant._id.toString(),
          MovementType.IN, // Nhập kho (IN)
          quantity,
          'Nhập kho thêm hàng từ Admin',
          adminId
        );
    return variant;
  }

  async findById(id: string) {
      // Lưu ý: Đổi chữ `variantModel` thành tên biến Model thực tế của bạn nếu nó khác nhé
      return this.variantModel.findById(id).exec();
    }
}