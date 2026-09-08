import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, BadRequestException, Put, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { NotificationsGateway } from '../notifications/notifications.gateway'; // <-- Import Gateway

@Controller('orders')
@UseGuards(JwtAuthGuard) // Toàn bộ API đơn hàng bắt buộc phải Đăng nhập
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly notificationsGateway: NotificationsGateway, // <-- Inject Gateway vào Controller
  ) {}

  // 1. Khách hàng tiến hành Checkout đặt hàng
  @Post()
  create(@GetUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    // Dùng user.userId hoặc user._id tùy thuộc vào cấu trúc Token khi Sign JWT của bạn
    const userId = user.userId || user._id;
    return this.ordersService.create(userId, createOrderDto);
  }

  // 2. Khách hàng xem lịch sử đơn hàng của chính mình (Đã gộp & hỗ trợ filter status)
  @Get('my-orders')
  async getMyOrders(@GetUser() user: any, @Query('status') status?: string) {
    const userId = user.userId || user._id;
    return this.ordersService.findAllByUser(userId, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SHIPPER)
  @Get('shipper/available')
  async getAvailableOrdersForShipper() {
    return this.ordersService.findAvailableOrdersForShipper();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SHIPPER)
  @Get('shipper/ongoing')
  async getOngoingOrdersForShipper(@GetUser() user: any) {
    const shipperId = user._id || user.userId;
    return this.ordersService.findOngoingOrdersForShipper(shipperId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SHIPPER) // Chỉ tài khoản có quyền SHIPPER hoặc ADMIN mới được gọi
  @Patch('shipper/update-status')
  async updateStatusByShipper(
    @Body('subOrderId') subOrderId: string,
    @Body('status') status: 'Shipped' | 'Delivered' | 'Cancelled',
    @Body('proofImage') proofImage: string,
    @GetUser() user: any // Lấy thông tin Shipper từ Token đã đăng nhập
  ) {
    if (!subOrderId || !status) {
      throw new BadRequestException('Vui lòng truyền đầy đủ subOrderId và trạng thái status mới!');
    }

    const shipperId = user._id || user.userId;
    // Truyền mã subOrderId, trạng thái mới và ID của Shipper sang Service xử lý
    return this.ordersService.updateStatusByShipper(subOrderId, status, shipperId, proofImage);
  }

  // 4. Khách hàng xem chi tiết 1 đơn hàng cụ thể
  // (Lưu ý: Đặt route :id nằm dưới shipper/update-status để tránh NestJS nhận nhầm chữ "shipper" thành ":id")
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // 👉 ĐÃ SỬA: Dùng findOrderUniversal thay vì findOne để hỗ trợ cả mã ORD... và mã ObjectId của MongoDB
    const order = await this.ordersService.findOrderUniversal(id);

    if (!order) {
       throw new NotFoundException('Không tìm thấy đơn hàng này');
    }

    return order;
  }

  // 5. Các Shop cập nhật trạng thái của riêng đơn hàng con thuộc shop mình
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_OWNER, Role.STORE_STAFF)
  @Patch('merchant/:id/status')
  async updateStatus(
    @Param('id') orderId: string,
    @Body('status') status: string,
    @GetUser() user: any
  ) {
    console.log("!!! Đã vào được Controller với ID:", orderId);
    const storeId = user.storeId || user.store;

    // 1. Lưu thay đổi trạng thái vào Database trước
    const updatedOrder = await this.ordersService.updateOrderStatus(orderId, storeId, status);

    // 2. TÍCH HỢP SOCKET: Nếu Merchant đổi trạng thái thành "Đang xử lý" (Processing)
    if (status === 'Processing') {
      this.notificationsGateway.broadcastToShippers('new_order_available', {
        orderId: orderId,
        storeId: storeId,
        status: status,
        data: updatedOrder // Đính kèm dữ liệu đơn hàng để App Shipper render ngay lập tức
      });
    }

    return updatedOrder;
  }

  // 6. Siêu Admin hệ thống xem tất cả các đơn hàng đang diễn ra trên sàn
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  findAllForAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  // 7. Lấy đơn hàng của chính store đang đăng nhập
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_OWNER, Role.STORE_STAFF)
  @Get('store/my-orders')
  async getMyStoreOrders(@GetUser() user: any) {
    const storeId = user.storeId || user.store;
    return this.ordersService.findOrdersByStore(storeId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SHIPPER)
  @Get('shipper/history')
  async getShipperHistory(@GetUser() user: any) {
    const shipperId = user._id || user.userId;
    return this.ordersService.getShipperOrderHistory(shipperId);
  }

  @Put(':id/cancel')
    async cancelOrder(
      @Param('id') id: string, // id này là ID của subOrder truyền từ React Native
      @GetUser() user: any
    ) {
      const userId = user.userId || user._id;
      return this.ordersService.cancelOrderByCustomer(id, userId);
    }
}