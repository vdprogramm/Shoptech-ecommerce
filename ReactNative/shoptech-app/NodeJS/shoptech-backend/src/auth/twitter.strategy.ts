import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor(private usersService: UsersService) {
    super({
      consumerKey: process.env.TWITTER_CONSUMER_KEY || 'YOUR_TWITTER_CONSUMER_KEY',
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET || 'YOUR_TWITTER_CONSUMER_SECRET',
      callbackURL: process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/auth/twitter/callback',
      includeEmail: true,
      passReqToCallback: true, // Cho phép truyền req vào hàm validate
    });
  }

  async validate(req: any, token: string, tokenSecret: string, profile: any, done: any) {
    try {
      const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
      if (!email) {
        return done(new Error('Tài khoản Twitter chưa liên kết Email'), false);
      }

      const userPayload = {
        sub: profile.id,
        name: profile.displayName,
        email: email
      };

      const user = await this.usersService.findOrCreateSocialUser(userPayload, 'twitter');

      // Lấy client type từ session (phục vụ cho việc điều hướng web hoặc app)
      const client = req.session?.client || 'web';

      // Trả về cả user và client để controller xử lý tiếp
      done(null, { user, client });
    } catch (err) {
      done(err, false);
    }
  }
}