import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/schemas/user.schema';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Đọc danh sách các quyền yêu cầu từ decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Nếu API không gắn @Roles() -> Cho phép đi qua (Miễn là đã qua JwtAuthGuard)
    if (!requiredRoles) {
      return true;
    }

    // 3. Lấy request và thông tin user từ JwtStrategy
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new UnauthorizedException('Không tìm thấy thông tin xác thực của người dùng');
    }

    // 4. Nếu user có quyền ADMIN tối cao hoặc SYSTEM -> Cho qua ngay không cần check storeId
    if (user.roles.includes(Role.ADMIN) || user.roles.includes(Role.SYSTEM)) {
      return true;
    }

    // 5. Kiểm tra quyền cơ bản (Role) xem có khớp không
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }

    // 6. KIỂM TRA BẢO MẬT CHÉO CHO MERCHANT (STORE_OWNER / STORE_STAFF)
    const isMerchant = user.roles.includes(Role.STORE_OWNER) || user.roles.includes(Role.STORE_STAFF);
    if (isMerchant) {
      // Tìm storeId được client gửi lên nằm trong body, params, hoặc query string
      const requestStoreId = request.body?.storeId || request.params?.storeId || request.query?.storeId;

      // Nếu API thao tác liên quan đến một store cụ thể, tiến hành đối chiếu
      if (requestStoreId && user.storeId) {
        if (user.storeId.toString() !== requestStoreId.toString()) {
          throw new ForbiddenException('Bạn không có quyền quản lý hoặc truy cập vào dữ liệu của cửa hàng khác!');
        }
      }
    }

    return true;
  }
}