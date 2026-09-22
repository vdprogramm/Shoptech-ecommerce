import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // Lưu trữ 2 chiều để tra cứu chéo tốc độ cao O(1)
  private userToSocket = new Map<string, string>();
  private socketToUser = new Map<string, string>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // 1. Khách hàng bắt buộc phải gửi Token qua handshake auth
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // 2. Giải mã Token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'DoAnShopTech_BiMat_TuyetDoi_123!@#',
      });

const userId = payload.sub || payload.userId;

      // Sửa chữ 'role' thành 'roles' ở ngay dòng này:
      const roles = payload.roles;

      // 3. Cho phép kết nối và lưu trạng thái
      this.userToSocket.set(userId, client.id);
      this.socketToUser.set(client.id, userId);

      // 4. Nhóm các Shipper vào chung một Room để dễ dàng Broadcast đơn mới
      if (roles && (roles.includes('SHIPPER') || roles.includes('shipper'))) {
        client.join('shippers_room');
        console.log(`🛵 Shipper [${userId}] đã online và tham gia phòng chờ nhận đơn`);
      }

      console.log(`✅ Socket Secure: Người dùng ${userId} (Roles: ${roles}) đã kết nối an toàn`);
    } catch (e) {
      console.log('❌ Socket Auth Failed: Token sai hoặc hết hạn', e.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Tìm userId cực nhanh nhờ Map thứ 2 và dọn dẹp bộ nhớ
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      this.userToSocket.delete(userId);
      this.socketToUser.delete(client.id);
      console.log(`🔴 Người dùng ${userId} đã ngắt kết nối`);
    }
  }

  // --- CÁC HÀM CUNG CẤP CHO SERVICE GỌI ---

  // 1. Bắn thông báo đích danh (VD: Báo cho Merchant khi Shipper nhận đơn)
  sendToUser(userId: string, eventName: string, data: any) {
    const socketId = this.userToSocket.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(eventName, data);
    }
  }

  // 2. Broadcast thông báo cho TOÀN BỘ Shipper đang online (Mô hình giành đơn)
  broadcastToShippers(eventName: string, data: any) {
    this.server.to('shippers_room').emit(eventName, data);
    console.log(`📢 Đã phát tín hiệu [${eventName}] tới toàn bộ phòng shippers_room`);
  }
}