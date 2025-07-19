import { Controller, Post, Body, Get, Query, Inject } from '@midwayjs/core';
import { PayService } from '../../service/pay/pay.service';
import { MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa'; // 只导入Context

@Controller('/api/pay')
export class PayController {
  @Inject()
  payService: PayService;

  // 充值下单
  @Post('/recharge')
  async recharge(@Body() body) {
    // console.log('[调试] /api/pay/recharge 入参:', body);
    const { userId, amount } = body;
    const { record, payUrl } = await this.payService.createRechargeOrder(
      userId,
      amount
    );
    // console.log('[调试] /api/pay/recharge payService 返回:', { record, payUrl });
    return { success: true, recharge_id: record.recharge_id, payUrl };
  }

  // 查询充值记录
  @Get('/records')
  async records(@Query('userId') userId: any) {
    // console.log('[调试] /api/pay/records 入参 userId:', userId);
    try {
      const id = Number(userId);
      if (!id || isNaN(id))
        throw new MidwayHttpError('缺少或非法userId参数', 400);
      // console.log('[调试] /api/pay/records 转换后 id:', id);
      const list = await this.payService.getRechargeRecords(id);
      // console.log('[调试] /api/pay/records service 返回:', list);
      return { success: true, data: list };
    } catch (err) {
      console.error('[调试] /api/pay/records 捕获异常:', err);
      throw err;
    }
  }

  // 支付宝回调（notify）
  @Post('/notify')
  @Get('/notify')
  async notify(ctx: Context) {
    // console.log('[调试] /api/pay/notify 开始处理回调');
    // console.log('[调试] /api/pay/notify 请求头:', ctx.headers);
    // console.log('[调试] /api/pay/notify 请求方法:', ctx.method);
    // console.log('[调试] /api/pay/notify 请求URL:', ctx.url);

    // 尝试多种方式获取回调数据
    let callbackData = '';

    // 方式1: 从rawBody获取
    if ((ctx.request as any).rawBody) {
      callbackData = (ctx.request as any).rawBody;
      // console.log('[调试] /api/pay/notify 从rawBody获取数据:', callbackData);
    }
    // 方式2: 从body获取
    else if (ctx.request.body) {
      if (typeof ctx.request.body === 'string') {
        callbackData = ctx.request.body;
      } else {
        callbackData = JSON.stringify(ctx.request.body);
      }
      // console.log('[调试] /api/pay/notify 从body获取数据:', callbackData);
    }
    // 方式3: 从query string获取
    else if (ctx.query && Object.keys(ctx.query).length > 0) {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(ctx.query)) {
        queryParams.append(key, value as string);
      }
      callbackData = queryParams.toString();
      // console.log('[调试] /api/pay/notify 从query获取数据:', callbackData);
    }

    if (!callbackData) {
      console.error('[调试] /api/pay/notify 无法获取回调数据');
      return 'fail';
    }

    try {
      const result = await this.payService.handleAlipayNotify(callbackData);
      // console.log('[调试] /api/pay/notify 处理成功:', result);
      return result;
    } catch (error) {
      console.error('[调试] /api/pay/notify 处理失败:', error);
      return 'fail';
    }
  }
}
