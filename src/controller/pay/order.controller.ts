import { Controller, Post, Get, Body, Query, Inject } from '@midwayjs/core';
import { OrderService } from '../../service/pay/order.service';
import { CreateOrderDTO } from '../../dto/pay/order.dto';
import { MidwayHttpError } from '@midwayjs/core';
import { BlindBoxService } from '../../service/blindbox/blindbox.service';

@Controller('/api/pay/order')
export class OrderController {
  @Inject()
  orderService: OrderService;

  @Inject()
  blindBoxService: BlindBoxService;

  // 创建订单
  @Post('/create')
  async createOrder(@Body() dto: CreateOrderDTO) {
    try {
      const result = await this.orderService.createOrder(dto);
      return { success: true, data: result };
    } catch (error) {
      throw new MidwayHttpError(error.message, error.status || 400);
    }
  }

  // 查询单个订单
  @Get('/get')
  async getOrder(@Query('id') id: number) {
    try {
      const order = await this.orderService.getOrderById(id);
      return { success: true, data: order };
    } catch (error) {
      throw new MidwayHttpError(error.message, error.status || 404);
    }
  }

  // 查询用户所有订单
  @Get('/list')
  async listOrders(@Query('user_id') userId: number) {
    try {
      const orders = await this.orderService.getOrdersByUserId(userId);
      return { success: true, data: orders };
    } catch (error) {
      throw new MidwayHttpError(error.message, error.status || 400);
    }
  }

  // 订单支付
  @Post('/pay')
  async payOrder(@Body('order_id') orderId: number) {
    try {
      const result = await this.orderService.payOrder(orderId);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 确认收货
  @Post('/confirm')
  async confirmOrder(@Body('order_id') orderId: number) {
    return await this.orderService.confirmOrder(orderId);
  }

  // 查询用户所有已完成订单及获得商品
  @Get('/completed')
  async getCompletedOrders(@Query('user_id') userId: number) {
    return await this.orderService.getCompletedOrdersWithItems(userId);
  }

  // 打开盲盒（抽奖）
  @Post('/open')
  async openOrderItem(@Body('order_item_id') orderItemId: number, @Body('user_id') userId: number) {
    try {
      const item = await this.orderService.openOrderItem(orderItemId, userId, this.blindBoxService);
      return { success: true, item };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 支付宝支付回调
  @Post('/alipayNotify')
  async alipayNotify(@Body('order_id') orderId: number, @Body('trade_no') tradeNo: string) {
    // 兼容老接口，组装参数
    const params = { out_trade_no: orderId, trade_no: tradeNo, trade_status: 'TRADE_SUCCESS' };
    return await this.orderService.handleAlipayNotify(JSON.stringify(params));
  }

  // 新增：支付宝异步回调接口
  @Post('/notify')
  async alipayNotifyAsync(@Body() params: Record<string, unknown>) {
    // 兼容支付宝form-data和json
    try {
      const result = await this.orderService.handleAlipayNotify(typeof params === 'string' ? params : JSON.stringify(params));
      return result;
    } catch (error) {
      return 'fail';
    }
  }

  // Docker环境模拟订单支付成功端点
  @Get('/mock-success')
  async mockOrderSuccess(@Query('out_trade_no') outTradeNo: string, @Query('amount') amount: string) {
    try {
      console.log('[Docker环境] 模拟订单支付成功回调:', { outTradeNo, amount });
      
      // 构造模拟的支付宝回调参数
      const mockParams = `out_trade_no=${outTradeNo}&trade_no=MOCK${Date.now()}&trade_status=TRADE_SUCCESS&total_amount=${amount}`;
      
      await this.orderService.handleAlipayNotify(mockParams);
      
      return {
        success: true,
        message: '模拟订单支付成功',
        data: {
          out_trade_no: outTradeNo,
          trade_no: `MOCK${Date.now()}`,
          trade_status: 'TRADE_SUCCESS',
          total_amount: amount
        }
      };
    } catch (error) {
      console.error('[Docker环境] 模拟订单支付成功处理失败:', error);
      throw error;
    }
  }
} 