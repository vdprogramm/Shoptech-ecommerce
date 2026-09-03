import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    // 🎯 CHUẨN HÓA: Inject trực tiếp Model FlashSaleCampaign đã đăng ký ở Module
    @InjectModel('FlashSaleCampaign') private readonly flashSaleCampaignModel: Model<any>,
  ) {}

// src/carts/carts.service.ts

async getCart(userId: string): Promise<any> {
  // 1. Tìm giỏ hàng và dùng .lean() để cho phép tùy ý ghi đè/chỉnh sửa thuộc tính giá
  let cart = await this.cartModel
    .findOne({ user: userId })
    .populate({
      path: 'items.variant',
      populate: { path: 'product' }
    })
    .lean(); // 🌟 THÊM .lean() Ở ĐÂY để tăng tốc và biến thành Plain Object

  if (!cart) {
    const newCart = await this.cartModel.create({ user: userId, items: [] });
    return newCart.toObject();
  }

  // LỚP PHÒNG THỦ: Loại bỏ dữ liệu rác nếu sản phẩm biến thể bị xóa khỏi hệ thống
  const validItems = cart.items.filter(item => item.variant !== null && item.variant !== undefined);
  if (validItems.length !== cart.items.length) {
    // Nếu dính hàng rác, cập nhật lại DB vật lý
    await this.cartModel.updateOne(
      { _id: cart._id },
      { $set: { items: validItems.map(i => ({ variant: (i.variant as any)._id || i.variant, quantity: i.quantity })) } }
    );
    cart.items = validItems;
  }

  try {
    const currentTime = new Date();

    const activeCampaigns = await this.flashSaleCampaignModel.find({
      isActive: true,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime }
    }).lean();

    // 3. Nếu tìm thấy chiến dịch Flash Sale đang chạy, tiến hành đè giá sale
    if (activeCampaigns && activeCampaigns.length > 0) {
      cart.items = cart.items.map((item: any) => {
        if (item.variant && item.variant._id) {
          const variantIdStr = item.variant._id.toString();
          const productIdStr = item.variant.product?._id ? item.variant.product._id.toString() : item.variant.product?.toString();

          let flashSaleItem: any = null;
          for (const campaign of activeCampaigns) {
            if (campaign.items) {
              const fsItem = campaign.items.find((fs: any) => {
                const targetVariant = fs.variant;
                const targetVariantIdStr = targetVariant?._id ? targetVariant._id.toString() : targetVariant?.toString();
                return targetVariantIdStr === variantIdStr || targetVariantIdStr === productIdStr;
              });
              if (fsItem) {
                flashSaleItem = fsItem;
                break;
              }
            }
          }

          // 🌟 CHỈ cập nhật khi tìm thấy Flash Sale
          if (flashSaleItem) {
            item.variant.originalPrice = item.variant.price;
            item.variant.price = flashSaleItem.salePrice; // Đè giá
            item.variant.isFlashSale = true;             // Đánh dấu để Frontend biết
          }
        }
        return item;
      });
    }
  } catch (error) {
    console.error("Lỗi khi đồng bộ giá Flash Sale vào giỏ hàng:", error);
  }

  return cart;
}

  /**
   * THÊM SẢN PHẨM VÀO GIỎ HÀNG
   */
  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { variantId, quantity } = addToCartDto;
    let cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      cart = new this.cartModel({ user: userId, items: [] });
    }

    // Kiểm tra xem biến thể này đã tồn tại trong mảng items chưa
    const itemIndex = cart.items.findIndex(
      (item: any) => item.variant?.toString() === variantId
    );

    if (itemIndex > -1) {
      // Đã tồn tại -> Cộng dồn số lượng thêm mới
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Chưa tồn tại -> Đẩy item mới vào mảng
      cart.items.push({ variant: variantId, quantity });
    }

    await cart.save();
    return this.getCart(userId); // Trả về giỏ hàng cập nhật mới nhất (đã chạy qua hàm ép giá sale)
  }

  /**
   * XÓA BỎ SẢN PHẨM KHỎI GIỎ HÀNG
   */
  async removeItem(userId: string, variantId: string) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new NotFoundException('Giỏ hàng không tìm thấy');

    // Lọc bỏ phần tử chứa variantId được chọn
    cart.items = cart.items.filter(
      (item: any) => item.variant?.toString() !== variantId
    );

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * CẬP NHẬT SỐ LƯỢNG SẢN PHẨM TRỰC TIẾP
   */
  async updateQuantity(userId: string, variantId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(userId, variantId); // Phòng thủ: Nếu số lượng tụt về 0 hoặc âm thì tự động xóa
    }

    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new NotFoundException('Giỏ hàng không tìm thấy');

    const itemIndex = cart.items.findIndex(
      (item: any) => item.variant?.toString() === variantId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
    }

    return this.getCart(userId);
  }
}