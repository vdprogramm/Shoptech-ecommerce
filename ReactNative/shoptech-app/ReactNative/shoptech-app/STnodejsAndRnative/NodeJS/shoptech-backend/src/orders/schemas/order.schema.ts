import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false }) // Không cần sinh _id riêng cho từng item
class OrderItem {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true })
  product: any;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true })
  variant: any;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop()
  image?: string;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
@Schema({ timestamps: true })
class SubOrder {
    _id?: mongoose.Types.ObjectId;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true })
  store: mongoose.Types.ObjectId; // Cửa hàng sở hữu các item này

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  subTotal: number; // Tổng tiền hàng của riêng shop này (chưa tính ship/voucher)

  @Prop({ required: true, default: 0 })
  shippingFee: number; // Phí ship riêng của shop này

  @Prop({ required: true })
  grandTotal: number; // Tổng tiền cuối cùng shop này nhận được: subTotal + shippingFee - voucherShop

  @Prop({
    default: 'Pending',
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
  })
  status: string; // Trạng thái đơn hàng riêng biệt của từng shop

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ShippingMethod' })
  shippingMethod: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
    shipperId: mongoose.Types.ObjectId | null;

  @Prop({ type: String, default: null })
  proofImage?: string | null;
}
const SubOrderSchema = SchemaFactory.createForClass(SubOrder);

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  // Danh sách các đơn hàng con được phân loại theo cửa hàng
  @Prop({ type: [SubOrderSchema], required: true })
  subOrders: SubOrder[];

  @Prop({ required: true })
  totalAmount: number; // Tổng số tiền khách hàng phải thanh toán thực tế (bằng tổng tất cả grandTotal của subOrders trừ voucher sàn)

  @Prop({ required: true })
  shippingAddress: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({
    default: 'Unpaid',
    enum: ['Unpaid', 'Paid', 'Refunded']
  })
  paymentStatus: string; // Trạng thái thanh toán của toàn bộ giao dịch

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' })
  globalVoucher: mongoose.Types.ObjectId; // Voucher giảm giá áp dụng cho toàn sàn (nếu có)

  @Prop({ default: 0 })
  pointsUsed: number;

  @Prop({ default: 0 })
  pointsDiscount: number;

  @Prop({ type: String, unique: true, index: true })
  orderCode: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);