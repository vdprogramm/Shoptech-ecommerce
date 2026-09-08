import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Lấy token từ header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'DoAnShopTech_BiMat_TuyetDoi_123!@#', // Tạm thời hardcode, sau này sẽ chuyển vào file .env
    });
  }

  // Hàm này tự động chạy nếu Token hợp lệ
  async validate(payload: any) {
    // Dữ liệu return ở đây sẽ được NestJS tự động gắn vào `req.user` ở các Controller
    return { userId: payload.sub, email: payload.email, roles: payload.roles, storeId: payload.storeId };
  }
}