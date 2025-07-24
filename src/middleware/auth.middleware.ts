import { Middleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';
import * as jwt from 'jsonwebtoken';

@Middleware()
export class AuthMiddleware {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 排除不需要认证的路由
      const noAuthPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/pay/notify',
        '/api/pay/order/notify', // 新增，允许订单支付回调无需鉴权
        '/api/blindbox/test', // 添加测试路径
        '/api/blindbox/debug', // 添加调试路径
      ];
      if (noAuthPaths.includes(ctx.path)) {
        await next();
        return;
      }

      const authHeader = ctx.headers.authorization;
      let token = '';
      if (
        authHeader &&
        typeof authHeader === 'string' &&
        authHeader.startsWith('Bearer ')
      ) {
        token = authHeader.substring(7);
      }

      if (!token) {
        ctx.status = 401;
        ctx.body = { message: '未提供认证令牌' };
        return;
      }

      try {
        const config = ctx.app.getConfig();
        const decoded = jwt.verify(token, config.jwt.secret) as Record<string, unknown>;
        // 将JWT中的userId映射为id，保持向后兼容
        ctx.user = {
          id: (decoded as { userId?: number }).userId,
          role: (decoded as { role?: string }).role,
          ...decoded
        };
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
