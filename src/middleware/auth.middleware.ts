import { Middleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';
import * as jwt from 'jsonwebtoken';

@Middleware()
export class AuthMiddleware {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      
      // 只拦截 /api 开头的接口
      if (!ctx.path.startsWith('/api')) {
        await next();
        return;
      }

      // 需要放行的API白名单
      const noAuthPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/pay/notify',
        '/api/pay/order/notify', // 新增，允许订单支付回调无需鉴权
        '/api/blindbox/test', // 添加测试路径
        '/api/blindbox/debug', // 添加调试路径
        '/api/blindbox/categories', // 分类统计（公开接口）
        '/api/blindbox/hot-keywords', // 热门关键词（公开接口）
        '/api/blindbox/comment/list', // 评论列表查询（公开接口）
        '/api/blindbox/comment/debug/all', // 调试接口（公开接口）
        '/api/blindbox/comment/debug/clean', // 清理接口（公开接口）
        '/api/blindbox/comment/debug/raw/', // 原生SQL调试接口（公开接口）
        '/api/blindbox/comment/debug/raw/2', // 原生SQL调试接口（公开接口）
        '/api/coupon', // 优惠券列表（公开接口）
        '/api/user-coupon/clean-expired', // 清理过期优惠券（系统维护接口）
        '/api/user-coupon/stats', // 优惠券统计信息（系统维护接口）

      ];
      // 支持精确和前缀匹配
      if (noAuthPaths.some(path => ctx.path === path || ctx.path.startsWith(path + '/'))) {
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
        
        // 将JWT中的用户信息正确映射
        const userId = (decoded as Record<string, unknown>).id || (decoded as Record<string, unknown>).userId;
        ctx.user = {
          id: userId,
          role: (decoded as Record<string, unknown>).role,
          username: (decoded as Record<string, unknown>).username,
          nickname: (decoded as Record<string, unknown>).nickname,
          ...decoded
        };
        
        // 确保用户ID存在
        if (!ctx.user.id) {
          ctx.status = 401;
          ctx.body = { message: '用户ID无效' };
          return;
        }
      } catch (err) {
        console.error('JWT验证失败:', err);
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
