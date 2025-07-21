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
    return await this.orderService.payOrder(orderId);
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
    return await this.orderService.openOrderItem(orderItemId, userId, this.blindBoxService);
  }
} 