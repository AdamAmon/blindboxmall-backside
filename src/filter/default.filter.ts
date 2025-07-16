import { Catch, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Catch()
export class DefaultErrorFilter {
  async catch(err: Error | MidwayHttpError, ctx: Context) {
    // 设置 HTTP 状态码
    const status = (err instanceof MidwayHttpError) ? err.status : 500;
    ctx.status = status;

    // 返回统一的 JSON 格式
    return {
      success: false,
      status,
      message: err.message || 'Internal Server Error',
      // 开发环境返回堆栈信息
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };
  }
}
