import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FlashSale } from './schemas/flash-sale.schema';

@Injectable()
export class FlashSalesService {
  constructor(
    @InjectModel(FlashSale.name) private flashSaleModel: Model<FlashSale>
  ) {}

  async createCampaign(data: any) {
    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new BadRequestException('Giờ kết thúc phải sau giờ bắt đầu');
    }
    return this.flashSaleModel.create(data);
  }

  async getCurrentActiveSale() {
    const now = new Date();

    return this.flashSaleModel.findOne({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
    .populate({
      path: 'items.variant',
      populate: {
        path: 'product',
        // 🛡️ SỬA TẠI ĐÂY: Cung cấp đầy đủ các trường định danh (_id, slug, hình ảnh) để Frontend bóc tách làm link chuẩn xác, không bị undefined
        select: '_id name description slug images thumbnail price'
      }
    })
    .exec();
  }

  async updateFlashSaleStockAfterOrder(
    campaignId: string,
    variantId: string,
    quantityPurchased: number
  ) {
    const campaign = await this.flashSaleModel.findById(campaignId);
    if (!campaign) {
      throw new NotFoundException('Không tìm thấy chương trình Flash Sale này');
    }

    const saleItem = campaign.items.find(
      (item) => item.variant.toString() === variantId
    );

    if (!saleItem) {
      throw new BadRequestException('Sản phẩm này không nằm trong chương trình giảm giá chớp nhoáng');
    }

    if (saleItem.soldCount + quantityPurchased > saleItem.quantityLimit) {
      throw new BadRequestException('Số lượng sản phẩm giá sốc còn lại không đủ đáp ứng!');
    }

    saleItem.soldCount += quantityPurchased;
    await campaign.save();
    return { success: true, currentSoldCount: saleItem.soldCount };
  }

  async findAll() {
    const now = new Date();
    const campaigns = await this.flashSaleModel.find()
      .populate({
        path: 'items.variant',
        populate: {
          path: 'product',
          select: '_id name description slug images thumbnail price'
        }
      })
      .sort({ createdAt: -1 })
      .exec();

  // Mapping lại dữ liệu để tính toán trạng thái thực tế
  return campaigns.map(c => {
    const campaignObj = c.toObject();
    const isNowActive = campaignObj.isActive && new Date(c.startTime) <= now && new Date(c.endTime) >= now;
    return { ...campaignObj, isActive: isNowActive };
  });
}

  async getFlashSaleByProductId(productId: string) {
    const now = new Date();

    const activeCampaign = await this.flashSaleModel.findOne({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
    .populate({
      path: 'items.variant',
      populate: {
        path: 'product'
      }
    })
    .exec();

    if (!activeCampaign) {
      return {
        isFlashSale: false,
        campaignId: null,
        endTime: null,
        saleItems: []
      };
    }

    const matchItems = activeCampaign.items.filter((item: any) => {
      if (!item.variant) return false;

      // 🛡️ SỬA TẠI ĐÂY: Xóa bỏ dòng so sánh lệch logic cũ (item.variant._id === productId)
      // Chỉ giữ lại logic so sánh chuẩn mực từ ID sản phẩm cha đã được populate
      const parentProduct = item.variant.product;
      if (!parentProduct) return false;

      const parentId = typeof parentProduct === 'object' ? parentProduct?._id?.toString() : parentProduct?.toString();
      return parentId === productId;
    });

    if (matchItems.length === 0) {
      return {
        isFlashSale: false,
        campaignId: activeCampaign._id,
        endTime: activeCampaign.endTime,
        saleItems: []
      };
    }

    // 🛡️ SỬA TẠI ĐÂY: Trả bổ sung tường minh thuộc tính `productId` ra Frontend, giúp Frontend không bao giờ bị lấy nhầm ID
    const saleItemsFormatted = matchItems.map((item: any) => ({
      productId: item.variant.product?._id?.toString() || productId,
      variantId: item.variant._id?.toString(),
      salePrice: item.salePrice,
      originalPrice: item.variant.price || item.salePrice,
      soldCount: item.soldCount || 0,
      limitStock: item.quantityLimit || 0
    }));

    return {
      isFlashSale: true,
      campaignId: activeCampaign._id,
      campaignName: activeCampaign.campaignName,
      endTime: activeCampaign.endTime,
      saleItems: saleItemsFormatted
    };
  }

  async updateCampaign(id: string, updateData: any) {
    const updated = await this.flashSaleModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) {
      throw new Error('Flash sale campaign not found');
    }
    return updated;
  }

  async deleteCampaign(id: string) {
    const deleted = await this.flashSaleModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new Error('Flash sale campaign not found');
    }
    return { message: 'Xóa chiến dịch thành công' };
  }
}