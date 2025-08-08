import { Controller, Post, Body, Get, Query, Inject } from '@midwayjs/core';
import { RechargeService } from '../../service/pay/recharge.service';
import { MidwayHttpError } from '@midwayjs/core';

@Controller('/api/pay')
export class RechargeController {
  @Inject()
  payService: RechargeService;

  // 充值下单
  @Post('/recharge')
  async recharge(@Body() body, ctx) {
    // 优先从token获取userId
    let userId = body.userId;
    if (!userId && ctx.user && ctx.user.id) {
      userId = ctx.user.id;
    }
    const { amount } = body;
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new MidwayHttpError('缺少或非法 amount 参数', 400);
    }
    const { record, payUrl } = await this.payService.createRechargeOrder(
      userId,
      amount
    );
    return { success: true, recharge_id: record.recharge_id, payUrl };
  }

  // 查询充值记录
  @Get('/records')
  async records(@Query('userId') userId: string | number, ctx) {
    try {
      let id = Number(userId);
      if ((!id || isNaN(id)) && ctx.user && ctx.user.id) {
        id = ctx.user.id;
      }
      if (!id || isNaN(id))
        throw new MidwayHttpError('缺少或非法userId参数', 400);
      const list = await this.payService.getRechargeRecords(id);
      return { success: true, data: list };
    } catch (err) {
      console.error('[调试] /api/pay/records 捕获异常:', err);
      throw err;
    }
  }

  // 支付宝回调（notify）
  @Post('/notify')
  async notify(@Body() params: Record<string, unknown>) {
    try {
      if (!params.out_trade_no) {
        console.error('[调试] handleAlipayNotify 缺少out_trade_no参数');
        throw new MidwayHttpError('缺少订单号参数', 400);
      }
      const result = await this.payService.handleAlipayNotify(
        typeof params === 'string' ? params : JSON.stringify(params)
      );
      return result;
    } catch (error) {
      console.error('[调试] /api/pay/notify 处理失败:', error);
      throw error;
    }
  }

  // Docker环境模拟支付成功端点
  @Get('/mock-success')
  async mockSuccess(@Query('out_trade_no') outTradeNo: string, @Query('amount') amount: string) {
    try {
      console.log('[Docker环境] 模拟支付成功回调:', { outTradeNo, amount });
      
      // 构造模拟的支付宝回调参数
      const mockParams = `out_trade_no=${outTradeNo}&trade_no=MOCK${Date.now()}&trade_status=TRADE_SUCCESS&total_amount=${amount}`;
      
      await this.payService.handleAlipayNotify(mockParams);
      
      return {
        success: true,
        message: '模拟支付成功',
        data: {
          out_trade_no: outTradeNo,
          trade_no: `MOCK${Date.now()}`,
          trade_status: 'TRADE_SUCCESS',
          total_amount: amount
        }
      };
    } catch (error) {
      console.error('[Docker环境] 模拟支付成功处理失败:', error);
      throw error;
    }
  }
}
