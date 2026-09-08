import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Module({
  imports: [
    // 1. Nhúng Database để lưu lịch sử thông báo
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    // 2. Nhúng JWT để xác thực bảo mật cho WebSockets
    JwtModule.register({}),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService],
  // 3. Export CẢ Service VÀ Gateway để các module khác (như OrdersModule) có thể sử dụng
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}