import { Catch, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Catch()
export class DefaultErrorFilter {
  async catch(err: Error | MidwayHttpError, ctx: Context) {
    // 只对 /api 路径返回 JSON，其他路径抛出让 fallback 处理
    if (ctx.path.startsWith('/api')) {
      const status = err instanceof MidwayHttpError ? err.status : 500;
      ctx.status = status;
      return {
        success: false,
        status,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      };
    }
    // 非 /api 路径，抛出错误让 fallback 中间件处理
    throw err;
  }
}
