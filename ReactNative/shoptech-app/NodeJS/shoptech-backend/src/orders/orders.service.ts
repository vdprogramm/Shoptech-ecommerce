import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './schemas/order.schema';
import { CartsService } from '../carts/carts.service';
import { ProductVariantsService } from '../product-variants/product-variants.service';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { MovementType } from '../stock-movements/schemas/stock-movement.schema';
import { ShippingMethodsService } from '../shipping-methods/shipping-methods.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto } from './dto/create-order.dto';
import mongoose from 'mongoose';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private cartsService: CartsService,
    private productVariantsService: ProductVariantsService,
    private stockMovementsService: StockMovementsService,
    private shippingMethodsService: ShippingMethodsService,
    private vouchersService: VouchersService,
    private notificationsService: NotificationsService,
    private pointsService: PointsService,
    private mailService: MailService,
  ) {}

  /**
   * 🛒 TẠO ĐƠN HÀNG (PHÂN TÁCH THEO CỬA HÀNG & ĐỒNG BỘ GIÁ FLASH SALE + VOUCHER)
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    // 1. Lấy dữ liệu giỏ hàng
    const cart = await this.cartsService.getCart(userId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng của bạn đang trống');
    }

    // 2. Lấy TẤT CẢ chiến dịch Flash Sale đang diễn ra
    const flashSaleCampaignModel = this.orderModel.db.model('FlashSaleCampaign');
    const currentTime = new Date();
    const activeCampaigns = await flashSaleCampaignModel.find({
      isActive: true,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime }
    }).lean() as any[];

    const storeOrdersMap = new Map<string, { store: string; items: any[]; subTotal: number }>();
    let globalTotalAmount = 0;

    const flashSaleItemsToUpdate: Array<{ campaignId: string; variantId: string; quantity: number }> = [];

    // 3. DUYỆT QUA CÁC ITEM TRONG GIỎ HÀNG
    for (const item of cart.items) {
      const variantId = (item.variant as any)?._id || item.variant;
      if (!variantId) {
        throw new BadRequestException('Dữ liệu giỏ hàng bị lỗi: Không tìm thấy biến thể sản phẩm');
      }

      const variant: any = await this.productVariantsService.findById(variantId.toString());
      if (!variant) {
        throw new NotFoundException('Sản phẩm trong giỏ không còn tồn tại trên hệ thống');
      }

      const storeId = variant.store?.toString() || (variant.product as any)?.store?.toString();
      if (!storeId) {
        throw new BadRequestException(`Sản phẩm "${variant.name || variant.sku}" chưa thuộc về cửa hàng nào!`);
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(`Sản phẩm "${variant.sku || variant.name}" chỉ còn ${variant.stock} sản phẩm trong kho!`);
      }

      variant.stock -= item.quantity;
      await variant.save();

      await this.stockMovementsService.recordMovement(
        variant._id,
        MovementType.OUT,
        item.quantity,
        `Xuất bán cho đơn hàng của user ${userId}`,
        userId
      );

      // Tăng soldCount cho Product
      try {
        const productModel = this.orderModel.db.model('Product');
        await productModel.updateOne(
          { _id: variant.product?._id || variant.product },
          { $inc: { soldCount: item.quantity } }
        );
      } catch (err) {
        console.error('Lỗi tăng soldCount:', err);
      }

      let itemPrice = variant.price;
      const variantIdStr = variant._id.toString();
      const productIdStr = variant.product?._id ? variant.product._id.toString() : variant.product?.toString();

      // 👉 ĐÃ SỬA: Ép kiểu any để TS không báo lỗi property 'salePrice' does not exist
      let flashSaleItem: any = null;
      let targetCampaign: any = null;

      for (const campaign of activeCampaigns) {
        if (campaign.items) {
          const fsItem = campaign.items.find((fs: any) => {
            const targetVariant = fs.variant;
            const targetVariantIdStr = targetVariant?._id ? targetVariant._id.toString() : targetVariant?.toString();
            return targetVariantIdStr === variantIdStr || targetVariantIdStr === productIdStr;
          });

          if (fsItem) {
            flashSaleItem = fsItem;
            targetCampaign = campaign;
            break; // Stop at first active campaign containing the item
          }
        }
      }

      // 👉 ĐÃ SỬA: Check cả targetCampaign để triệt tiêu lỗi "possibly 'null'"
      if (flashSaleItem && targetCampaign) {
        itemPrice = flashSaleItem.salePrice;
        flashSaleItemsToUpdate.push({
          campaignId: targetCampaign._id.toString(),
          variantId: variantIdStr,
          quantity: item.quantity
        });
      }

      const itemSubTotal = itemPrice * item.quantity;

      const orderItem = {
        product: variant.product?._id || variant.product,
        variant: variant._id,
        name: variant.name || (variant.product as any)?.name || 'Sản phẩm',
        sku: variant.sku || 'SKU-UNKNOWN',
        price: itemPrice,
        quantity: item.quantity,
        image: variant.image || (variant.product as any)?.images?.[0] || '',
      };

      if (!storeOrdersMap.has(storeId)) {
        storeOrdersMap.set(storeId, {
          store: storeId,
          items: [orderItem],
          subTotal: itemSubTotal,
        });
      } else {
        const targetStoreOrder = storeOrdersMap.get(storeId)!;
        targetStoreOrder.items.push(orderItem);
        targetStoreOrder.subTotal += itemSubTotal;
      }

      globalTotalAmount += itemSubTotal;
    }

    // 4. XỬ LÝ PHÍ VẬN CHUYỂN
    let baseShippingFee = 0;
    if (createOrderDto.shippingMethod) {
      const activeMethods = await this.shippingMethodsService.getActiveMethods();
      const selectedMethod = activeMethods.find(m => m._id.toString() === createOrderDto.shippingMethod);
      if (selectedMethod) {
        baseShippingFee = selectedMethod.baseFee;
      }
    }

    // Tạm tính tổng tiền hàng trước voucher để tính tỷ lệ phân bổ voucher
    let rawGlobalSubTotalWithShipping = 0;
    const tempSubOrders: any[] = [];

    for (const [storeId, storeData] of storeOrdersMap.entries()) {
      const storeShippingFee = baseShippingFee;
      const rawGrandTotal = storeData.subTotal + storeShippingFee;
      rawGlobalSubTotalWithShipping += rawGrandTotal;

      tempSubOrders.push({
        store: new mongoose.Types.ObjectId(storeId),
        items: storeData.items,
        subTotal: storeData.subTotal,
        shippingFee: storeShippingFee,
        grandTotal: rawGrandTotal,
        status: 'Pending',
        shippingMethod: createOrderDto.shippingMethod ? new mongoose.Types.ObjectId(createOrderDto.shippingMethod) : undefined,
        shipperId: null,
      });
    }

    // 5. ÁP DỤNG VOUCHER & PHÂN BỔ
    let appliedVoucher: any = null;
    let finalGlobalTotal = 0;

    if (createOrderDto.voucherCode) {
      const voucherModel = this.orderModel.db.model('Voucher');
      const voucherDoc = await voucherModel.findOne({ code: createOrderDto.voucherCode.toUpperCase() });

      if (!voucherDoc) {
        throw new BadRequestException('Mã giảm giá không hợp lệ');
      }

      let applicableTotal = globalTotalAmount;
      if (voucherDoc.store) {
         const storeIdStr = voucherDoc.store.toString();
         const subOrder = tempSubOrders.find(sub => sub.store.toString() === storeIdStr);
         if (!subOrder) {
             throw new BadRequestException('Mã giảm giá này chỉ áp dụng cho sản phẩm của gian hàng tương ứng');
         }
         applicableTotal = subOrder.subTotal;
      }

      const voucherCheck = await this.vouchersService.validateVoucher(createOrderDto.voucherCode, applicableTotal);
      const totalDiscount = applicableTotal - voucherCheck.finalTotal;

      if (voucherDoc.store) {
          const storeIdStr = voucherDoc.store.toString();
          tempSubOrders.forEach(sub => {
              if (sub.store.toString() === storeIdStr) {
                  sub.grandTotal = Math.max(0, (sub.subTotal + sub.shippingFee) - totalDiscount);
              } else {
                  sub.grandTotal = sub.subTotal + sub.shippingFee;
              }
          });
      } else {
          let distributedDiscount = 0;
          tempSubOrders.forEach((sub, index) => {
            let subDiscount = 0;
            if (index === tempSubOrders.length - 1) {
              subDiscount = totalDiscount - distributedDiscount;
            } else {
              subDiscount = Math.round((sub.subTotal / globalTotalAmount) * totalDiscount);
              distributedDiscount += subDiscount;
            }
            sub.grandTotal = Math.max(0, (sub.subTotal + sub.shippingFee) - subDiscount);
          });
      }

      finalGlobalTotal = tempSubOrders.reduce((sum, sub) => sum + sub.grandTotal, 0);
      appliedVoucher = voucherCheck.voucherId;
    } else {
      finalGlobalTotal = rawGlobalSubTotalWithShipping;
    }

    // 5.5. ÁP DỤNG F-POINT
    let actualPointsUsed = 0;
    let pointsDiscount = 0;

    if (createOrderDto.pointsUsed && createOrderDto.pointsUsed > 0) {
      const userPointsData = await this.pointsService.getUserPoints(userId);
      if (userPointsData.points >= createOrderDto.pointsUsed) {
        actualPointsUsed = createOrderDto.pointsUsed;
        pointsDiscount = actualPointsUsed * 1000;

        if (pointsDiscount > finalGlobalTotal) {
           pointsDiscount = finalGlobalTotal;
           actualPointsUsed = Math.ceil(pointsDiscount / 1000);
        }

        let distributedPointsDiscount = 0;
        tempSubOrders.forEach((sub, index) => {
          let subDiscount = 0;
          if (index === tempSubOrders.length - 1) {
            subDiscount = pointsDiscount - distributedPointsDiscount;
          } else {
            subDiscount = Math.round((sub.grandTotal / finalGlobalTotal) * pointsDiscount);
            distributedPointsDiscount += subDiscount;
          }
          sub.grandTotal = Math.max(0, sub.grandTotal - subDiscount);
        });

        finalGlobalTotal = tempSubOrders.reduce((sum, sub) => sum + sub.grandTotal, 0);
      } else {
        throw new BadRequestException('Số điểm tích lũy không đủ để sử dụng.');
      }
    }

    try {
      const orderCode = 'ORD' + Math.floor(100000 + Math.random() * 900000).toString();
      const newOrder = await this.orderModel.create({
        user: new mongoose.Types.ObjectId(userId),
        orderCode: orderCode,
        subOrders: tempSubOrders,
        totalAmount: finalGlobalTotal,
        shippingAddress: createOrderDto.shippingAddress,
        paymentMethod: createOrderDto.paymentMethod,
        paymentStatus: 'Unpaid',
        globalVoucher: appliedVoucher,
        pointsUsed: actualPointsUsed,
        pointsDiscount: pointsDiscount,
      });

      if (actualPointsUsed > 0) {
        await this.pointsService.redeemPoints(userId, actualPointsUsed, String(newOrder._id));
      }

      if (appliedVoucher) {
        await this.vouchersService.incrementUsedCount(appliedVoucher);
      }

      if (flashSaleItemsToUpdate.length > 0) {
        try {
          const updatesByCampaign = new Map<string, typeof flashSaleItemsToUpdate>();
          for (const update of flashSaleItemsToUpdate) {
            if (!updatesByCampaign.has(update.campaignId)) {
              updatesByCampaign.set(update.campaignId, []);
            }
            updatesByCampaign.get(update.campaignId)!.push(update);
          }

          for (const [campaignIdStr, updates] of updatesByCampaign.entries()) {
            const campaign = activeCampaigns.find(c => c._id.toString() === campaignIdStr);
            if (campaign) {
              await flashSaleCampaignModel.updateOne(
                { _id: campaign._id },
                {
                  $set: {
                    items: campaign.items.map((i: any) => {
                      const targetVariant = i.variant;
                      const iVariantIdStr = targetVariant?._id ? targetVariant._id.toString() : targetVariant?.toString();
                      const productIdStr = i.product?._id ? i.product._id.toString() : i.product?.toString();

                      const updateInfo = updates.find(u => u.variantId === iVariantIdStr || u.variantId === productIdStr);
                      if (updateInfo) {
                        i.soldCount = (i.soldCount || 0) + updateInfo.quantity;
                      }
                      return i;
                    })
                  }
                }
              );
            }
          }
        } catch (fsError) {
          console.error("Lỗi cập nhật soldCount cho Flash Sale:", fsError);
        }
      }

      const cartModel = this.orderModel.db.model('Cart');
      await cartModel.updateOne({ user: userId }, { $set: { items: [] } });

      const userModel = this.orderModel.db.model('User');
      const userEntity = await userModel.findById(userId);
      if (userEntity && userEntity.email) {
        this.mailService.sendOrderSuccessMail(
          userEntity.email,
          userEntity.fullName || 'Khách hàng',
          newOrder.orderCode,
          newOrder.totalAmount
        ).catch(err => console.error('Lỗi gửi mail tạo đơn:', err));
      }

      return newOrder;
    } catch (error) {
      console.error("Lỗi hệ thống khi tạo đơn hàng:", error);
      throw new InternalServerErrorException('Lỗi hệ thống khi tạo đơn hàng phân tách');
    }
  }

  async findAllByUser(userId: string, status?: string) {
    const query: any = { user: new mongoose.Types.ObjectId(userId) };
    if (status) {
      query['subOrders.status'] = status;
    }
    return this.orderModel
      .find(query)
      .populate('subOrders.store', 'name logo')
      .populate({
        path: 'subOrders.items.product',
        select: 'name images'
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return this.orderModel.findById(id).populate('subOrders.store', 'name logo').exec();
  }

  async updateOrderStatus(orderId: string, storeId: string, newStatus: string) {
    const order = await this.orderModel.findOne({
      'subOrders._id': new mongoose.Types.ObjectId(orderId)
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng chứa ID này');
    }

    const subOrder = order.subOrders.find(sub => sub._id?.toString() === orderId.toString());

    if (!subOrder || subOrder.store.toString() !== storeId.toString()) {
      throw new BadRequestException('Đơn hàng này không thuộc cửa hàng của bạn hoặc ID không hợp lệ');
    }

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new BadRequestException(`Trạng thái "${newStatus}" không hợp lệ. Vui lòng chọn: ${validStatuses.join(', ')}`);
    }

    if (newStatus === 'Cancelled' && subOrder.status !== 'Cancelled') {
      for (const item of subOrder.items) {
        const variant: any = await this.productVariantsService.findById(item.variant.toString());
        if (variant) {
          variant.stock += item.quantity;
          await variant.save();

          await this.stockMovementsService.recordMovement(
            variant._id,
            MovementType.IN,
            item.quantity,
            `Hoàn kho do đơn hàng con ${orderId} bị hủy`,
            order.user.toString()
          );

          try {
            const productModel = this.orderModel.db.model('Product');
            await productModel.updateOne(
              { _id: item.product },
              { $inc: { soldCount: -item.quantity } }
            );
          } catch (err) {
            console.error('Lỗi giảm soldCount:', err);
          }
        }
      }
    }

    const isAlreadyDelivered = subOrder.status === 'Delivered';
    subOrder.status = newStatus;

    if (!isAlreadyDelivered && newStatus === 'Delivered') {
      await this.pointsService.rewardPointsForOrder(
        order.user.toString(),
        String(subOrder._id),
        subOrder.grandTotal
      );

      const warrantyModel = this.orderModel.db.model('Warranty');
      for (const item of subOrder.items) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 12);

        await warrantyModel.create({
          user: order.user,
          order: order._id,
          product: item.product,
          startDate: startDate,
          endDate: endDate,
        });
      }
    }

    if (newStatus === 'Delivered' && order.paymentMethod.includes('COD')) {
      const allDelivered = order.subOrders.every(sub => sub.status === 'Delivered');
      if (allDelivered) {
        order.paymentStatus = 'Paid';
      }
    }

    await order.save();

    let message = '';
    switch (newStatus) {
      case 'Processing': message = `Đơn hàng của bạn đã được cửa hàng xác nhận và đang chuẩn bị.`; break;
      case 'Shipped': message = `Sản phẩm của bạn đã được bàn giao cho đơn vị vận chuyển.`; break;
      case 'Delivered': message = `Đơn hàng đã được giao thành công! Cảm ơn bạn đã mua sắm.`; break;
      case 'Cancelled': message = `Đơn hàng của bạn đã bị hủy bởi cửa hàng.`; break;
    }

    if (message) {
      await this.notificationsService.createAndSend(order.user.toString(), 'Cập nhật đơn hàng', message, orderId);

      if (subOrder.shipperId) {
         let shipperMsg = '';
         if (newStatus === 'Cancelled') shipperMsg = `Đơn hàng ${orderId.slice(-8).toUpperCase()} đã bị huỷ bởi cửa hàng. Bạn không cần giao đơn này nữa.`;
         if (shipperMsg) {
             await this.notificationsService.createAndSend(subOrder.shipperId.toString(), 'Cập nhật từ cửa hàng', shipperMsg, orderId);
         }
      }
    }

    if (newStatus === 'Cancelled') {
      const userModel = this.orderModel.db.model('User');
      const userEntity = await userModel.findById(order.user);
      if (userEntity && userEntity.email) {
        this.mailService.sendOrderCancelledMail(
          userEntity.email,
          userEntity.fullName || 'Khách hàng',
          order.orderCode,
          'Cửa hàng yêu cầu hủy đơn'
        ).catch(err => console.error('Lỗi gửi mail hủy đơn (từ shop):', err));
      }
    }

    return order;
  }

  async updateStatusByShipper(subOrderId: string, status: 'Shipped' | 'Delivered' | 'Cancelled', shipperId: string, proofImage?: string) {
    const order = await this.orderModel.findOne({ 'subOrders._id': new mongoose.Types.ObjectId(subOrderId) });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng con này trên hệ thống');
    }

    const subOrderIndex = order.subOrders.findIndex((item: any) => item._id.toString() === subOrderId);
    const currentSubOrder = order.subOrders[subOrderIndex];

    if (status === 'Shipped' && currentSubOrder.status !== 'Processing') {
      throw new BadRequestException('Chỉ có thể gom giao những đơn hàng đang ở trạng thái Processing!');
    }
    if (status === 'Delivered' && currentSubOrder.status !== 'Shipped') {
      throw new BadRequestException('Chỉ có thể xác nhận Đã Giao cho các đơn hàng đang trên đường đi (Shipped)!');
    }

    const updateQuery: any = {};
    updateQuery[`subOrders.${subOrderIndex}.status`] = status;
    updateQuery[`subOrders.${subOrderIndex}.updatedAt`] = new Date();

    if (status === 'Shipped') {
      updateQuery[`subOrders.${subOrderIndex}.shipperId`] = new Types.ObjectId(shipperId);
    }
    
    if (status === 'Delivered' && proofImage) {
      updateQuery[`subOrders.${subOrderIndex}.proofImage`] = proofImage;
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      order._id,
      { $set: updateQuery },
      { new: true }
    );

    if (status === 'Delivered') {
      const currentOrderState = await this.orderModel.findById(order._id);

      const userModel = this.orderModel.db.model('User');
      await userModel.findByIdAndUpdate(shipperId, {
        $inc: { walletBalance: currentSubOrder.shippingFee }
      });

      await this.pointsService.rewardPointsForOrder(
        order.user.toString(),
        String(currentSubOrder._id),
        currentSubOrder.grandTotal
      );

      const warrantyModel = this.orderModel.db.model('Warranty');
      for (const item of currentSubOrder.items) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 12);

        await warrantyModel.create({
          user: order.user,
          order: order._id,
          product: item.product,
          startDate: startDate,
          endDate: endDate,
        });
      }

      if (currentOrderState && currentOrderState.paymentMethod.includes('COD')) {
        const allDelivered = currentOrderState.subOrders.every(sub => sub.status === 'Delivered');
        if (allDelivered) {
          currentOrderState.paymentStatus = 'Paid';
          await currentOrderState.save();
        }
      }

      const userEntity = await userModel.findById(order.user);
      if (userEntity && userEntity.email) {
        this.mailService.sendDeliverySuccessMail(
          userEntity.email,
          userEntity.fullName || 'Khách hàng',
          order.orderCode
        ).catch(err => console.error('Lỗi gửi mail giao hàng:', err));
      }
    }

    let notificationMessage = '';
    if (status === 'Shipped') {
      notificationMessage = `Đơn hàng con của bạn đang được shipper vận chuyển.`;
    } else if (status === 'Delivered') {
      notificationMessage = `Đơn hàng của bạn đã được shipper giao thành công.`;
    }

    if (notificationMessage) {
      try {
        await this.notificationsService.createAndSend(order.user.toString(), 'Cập nhật đơn hàng', notificationMessage, subOrderId);
        if (status === 'Shipped') {
          await this.notificationsService.createAndSend(shipperId, 'Nhận đơn thành công', `Bạn đã nhận giao đơn hàng ${subOrderId.slice(-8).toUpperCase()}.`, subOrderId);
        } else if (status === 'Delivered') {
          await this.notificationsService.createAndSend(shipperId, 'Giao hàng thành công', `Đơn hàng ${subOrderId.slice(-8).toUpperCase()} đã được giao hoàn tất.`, subOrderId);
        }
      } catch (notiErr) {
        console.error('Lỗi gửi thông báo:', notiErr);
      }
    }

    return updatedOrder;
  }

  async findAllForAdmin() {
    return await this.orderModel.find().sort({ createdAt: -1 }).populate('user', 'fullName email').exec();
  }

  async findOrdersByStore(storeId: string) {
    const orders = await this.orderModel.find({ 'subOrders.store': storeId })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName email')
      .lean()
      .exec();

    // Lọc bỏ những subOrder của shop khác
    return orders.map((order: any) => {
      order.subOrders = order.subOrders.filter(
        (sub: any) => sub.store.toString() === storeId.toString()
      );
      return order;
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: string) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    order.paymentStatus = paymentStatus;

    if (paymentStatus === 'Paid') {
      order.subOrders.forEach(sub => {
        if (sub.status === 'Pending') {
          sub.status = 'Processing';
        }
      });
    }

    return order.save();
  }

  async getTopSellingProductIds(limit: number = 10): Promise<Array<{ productId: string; totalSold: number }>> {
    const result = await this.orderModel.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $unwind: '$subOrders' },
      { $match: { 'subOrders.status': 'Delivered' } },
      { $unwind: '$subOrders.items' },
      {
        $group: {
          _id: '$subOrders.items.product',
          totalSold: { $sum: '$subOrders.items.quantity' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]).exec();

    return result.map(item => ({
      productId: item._id.toString(),
      totalSold: item.totalSold
    }));
  }

  // Helper to resolve shipping address ObjectIds for backwards compatibility
  private async resolveShippingAddresses(orders: any[]) {
    const addressModel = this.orderModel.db.model('Address');
    for (const order of orders) {
      if (order.shippingAddress && mongoose.Types.ObjectId.isValid(order.shippingAddress) && order.shippingAddress.length === 24) {
        try {
          const address = await addressModel.findById(order.shippingAddress);
          if (address) {
            order.shippingAddress = `${address.receiverName || 'Người nhận'} - ${address.phone ? address.phone + ' - ' : ''}${address.street}, ${address.ward}, ${address.district}${address.province ? ', ' + address.province : ''}`;
          }
        } catch (err) {
          console.error('Error resolving address:', err);
        }
      }
    }
  }

  async findAvailableOrdersForShipper() {
    const orders = await this.orderModel.find({
      'subOrders.status': 'Processing',
      $or: [
        { 'subOrders.shipperId': null },
        { 'subOrders.shipperId': { $exists: false } }
      ]
    })
    .populate('user', 'fullName email')
    .populate('subOrders.store', 'name address phone')
    .sort({ createdAt: -1 })
    .lean()
    .exec();

    await this.resolveShippingAddresses(orders);

    const availableSubOrders: any[] = [];

    orders.forEach((order: any) => {
      order.subOrders.forEach((sub: any) => {
        if (sub.status === 'Processing' && !sub.shipperId) {
          availableSubOrders.push({
            parentOrderId: order._id,
            subOrderId: sub._id,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            customer: order.user,
            store: sub.store,
            items: sub.items,
            grandTotal: sub.grandTotal,
            createdAt: order.createdAt
          });
        }
      });
    });

    return availableSubOrders;
  }

  async getShipperOrderHistory(shipperId: string) {
    const shipperObjectId = new Types.ObjectId(shipperId);

    const orders = await this.orderModel.find({
      'subOrders.shipperId': shipperObjectId,
      'subOrders.status': { $in: ['Delivered', 'Cancelled'] }
    })
    .populate('user', 'fullName phone')
    .populate('subOrders.store', 'name address phone')
    .sort({ updatedAt: -1 })
    .lean()
    .exec();

    await this.resolveShippingAddresses(orders);

    const historyList: any[] = [];

    orders.forEach((order: any) => {
      order.subOrders.forEach((sub: any) => {
        if (
          sub.shipperId?.toString() === shipperId &&
          ['Delivered', 'Cancelled'].includes(sub.status)
        ) {
          historyList.push({
            parentOrderId: order._id,
            subOrderId: sub._id,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            customer: {
              _id: order.user?._id,
              fullName: order.user?.fullName,
              phone: order.user?.phone
            },
            store: sub.store,
            items: sub.items,
            grandTotal: sub.grandTotal,
            shippingFee: sub.shippingFee,
            status: sub.status,
            completedAt: order.updatedAt
          });
        }
      });
    });

    return historyList;
  }

  async findOngoingOrdersForShipper(shipperId: string) {
    const shipperObjectId = new Types.ObjectId(shipperId);

    const orders = await this.orderModel.find({
      'subOrders.shipperId': shipperObjectId,
      'subOrders.status': 'Shipped'
    })
    .populate('user', 'fullName phone')
    .populate('subOrders.store', 'name address phone')
    .sort({ updatedAt: -1 })
    .lean()
    .exec();

    await this.resolveShippingAddresses(orders);

    const ongoingList: any[] = [];

    orders.forEach((order: any) => {
      order.subOrders.forEach((sub: any) => {
        if (
          sub.shipperId?.toString() === shipperId &&
          sub.status === 'Shipped'
        ) {
          ongoingList.push({
            parentOrderId: order._id,
            subOrderId: sub._id,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            customer: {
              _id: order.user?._id,
              fullName: order.user?.fullName,
              phone: order.user?.phone
            },
            store: sub.store,
            items: sub.items,
            grandTotal: sub.grandTotal,
            shippingFee: sub.shippingFee,
            status: sub.status,
            createdAt: order.createdAt
          });
        }
      });
    });

    return ongoingList;
  }

  async cancelOrderByCustomer(subOrderId: string, userId: string) {
      const order = await this.orderModel.findOne({
        'subOrders._id': new mongoose.Types.ObjectId(subOrderId),
        user: new mongoose.Types.ObjectId(userId)
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng của bạn, hoặc bạn không có quyền hủy đơn này.');
      }

      const subOrder = order.subOrders.find(sub => sub._id?.toString() === subOrderId.toString());

      if (!subOrder) {
        throw new NotFoundException('Không tìm thấy thông tin đơn hàng con.');
      }

      if (subOrder.status !== 'Pending') {
        throw new BadRequestException('Bạn không thể hủy đơn hàng đã được xác nhận hoặc đang giao. Vui lòng liên hệ cửa hàng.');
      }

      for (const item of subOrder.items) {
        const variant: any = await this.productVariantsService.findById(item.variant.toString());
        if (variant) {
          variant.stock += item.quantity;
          await variant.save();

          await this.stockMovementsService.recordMovement(
            variant._id,
            MovementType.IN,
            item.quantity,
            `Hoàn kho do khách hàng tự hủy đơn ${subOrderId}`,
            userId
          );

          try {
            const productModel = this.orderModel.db.model('Product');
            await productModel.updateOne(
              { _id: item.product },
              { $inc: { soldCount: -item.quantity } }
            );
          } catch (err) {
            console.error('Lỗi giảm soldCount:', err);
          }
        }
      }

      subOrder.status = 'Cancelled';
      await order.save();

      try {
        await this.notificationsService.createAndSend(
          subOrder.store.toString(),
          'Khách hàng đã hủy đơn',
          `Đơn hàng ${subOrderId.slice(-8).toUpperCase()} vừa bị khách hàng hủy.`,
          subOrderId
        );
      } catch (error) {
        console.log('Lỗi gửi thông báo cho shop:', error);
      }

      const userModel = this.orderModel.db.model('User');
      const userEntity = await userModel.findById(userId);
      if (userEntity && userEntity.email) {
        this.mailService.sendOrderCancelledMail(
          userEntity.email,
          userEntity.fullName || 'Khách hàng',
          order.orderCode,
          'Bạn đã yêu cầu hủy đơn'
        ).catch(err => console.error('Lỗi gửi mail hủy đơn (từ khách):', err));
      }

      return { message: 'Hủy đơn hàng thành công', order };
    }

  async findByOrderCode(orderCode: string) {
    const order = await this.orderModel.findOne({ orderCode: orderCode }).exec();
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng với mã này');
    }
    return order;
  }

  async findOrderUniversal(idOrCode: string) {
      if (!idOrCode) return null;

      let order = await this.orderModel.findOne({ orderCode: idOrCode }).exec();
      if (order) return order;

      if (mongoose.Types.ObjectId.isValid(idOrCode)) {
        order = await this.orderModel.findById(idOrCode).exec();
        if (order) return order;

        order = await this.orderModel.findOne({ 'subOrders._id': new mongoose.Types.ObjectId(idOrCode) }).exec();
        if (order) return order;
      }
      return null;
    }
}