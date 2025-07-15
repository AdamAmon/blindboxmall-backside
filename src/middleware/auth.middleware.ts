//:src/middleware/auth.middleware.ts
import { Middleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';
import * as jwt from 'jsonwebtoken';

@Middleware()
export class AuthMiddleware {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 排除登录/注册路由
      if (ctx.path === '/auth/login' || ctx.path === '/auth/register') {
        await next();
        return;
      }

      const token = ctx.headers.authorization?.split(' ')[1];
      if (!token) {
        ctx.status = 401;
        ctx.body = { message: '未提供认证令牌' };
        return;
      }

      try {
        const config = ctx.app.getConfig();
        const decoded = jwt.verify(token, config.jwt.secret);
        ctx.user = decoded; // 将用户信息附加到上下文
        await next();
      } catch (err) {
        ctx.status = 401;
        ctx.body = { message: '无效或过期的令牌' };
      }
    };
  }

  static getName(): string {
    return 'auth';
  }
}
