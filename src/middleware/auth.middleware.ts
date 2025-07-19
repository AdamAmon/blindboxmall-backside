import { Middleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';
import * as jwt from 'jsonwebtoken';

@Middleware()
export class AuthMiddleware {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 排除不需要认证的路由
      const noAuthPaths = ['/api/auth/login', '/api/auth/register', '/api/pay/notify'];
      if (noAuthPaths.includes(ctx.path)) {
        await next();
        return;
      }

      const authHeader = ctx.headers.authorization;
      let token = '';
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      if (!token) {
        ctx.status = 401;
        ctx.body = { message: '未提供认证令牌' };
        return;
      }

      try {
        const config = ctx.app.getConfig();
        const decoded = jwt.verify(token, config.jwt.secret);
        ctx.user = decoded; // 附加用户信息到上下文
      } catch (err) {
        ctx.status = 401;
        ctx.body = { message: '无效或过期的令牌' };
        return;
      }
      await next(); // 关键修改：验证后交给后续处理
    };
  }

  static getName(): string {
    return 'auth';
  }
}
