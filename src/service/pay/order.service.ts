import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entity/pay/order.entity';
import { OrderItem } from '../../entity/pay/order-item.entity';
import { CreateOrderDTO, CreateOrderItemDTO } from '../../dto/pay/order.dto';
import { MidwayHttpError } from '@midwayjs/core';
import { BlindBoxService } from '../blindbox/blindbox.service';

@Provide()
export class OrderService {
  @InjectEntityModel(Order)
  orderRepo: Repository<Order>;

  @InjectEntityModel(OrderItem)
  orderItemRepo: Repository<OrderItem>;

  // 创建订单及订单项
  async createOrder(dto: CreateOrderDTO) {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new MidwayHttpError('订单项不能为空', 400);
    }
    // 创建订单
    const order = this.orderRepo.create({
      user_id: dto.user_id,
      address_id: dto.address_id,
      total_amount: dto.total_amount,
      status: 'pending',
      pay_method: dto.pay_method,
      cancelled: false,
    });
    const savedOrder = await this.orderRepo.save(order);
    // 创建订单项
    const items = dto.items.map((item: CreateOrderItemDTO) =>
      this.orderItemRepo.create({
        order_id: savedOrder.id,
        blind_box_id: item.blind_box_id,
        item_id: item.item_id,
        price: item.price,
      })
    );
    await this.orderItemRepo.save(items);
    // 启动超时未支付自动取消（仅非测试环境下注册定时器）
    if (process.env.NODE_ENV !== 'unittest') {
      setTimeout(async () => {
        const latest = await this.orderRepo.findOne({ where: { id: savedOrder.id } });
        if (latest && latest.status === 'pending' && !latest.cancelled) {
          latest.status = 'cancelled';
          latest.cancelled = true;
          await this.orderRepo.save(latest);
        }
      }, 600000); // 600秒
    }
    return { order: savedOrder, items };
  }

  // 查询单个订单
  async getOrderById(orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['orderItems', 'user', 'address'],
    });
    if (!order) throw new MidwayHttpError('订单不存在', 404);
    return order;
  }

  // 查询用户所有订单
  async getOrdersByUserId(userId: number) {
    return this.orderRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // 新增：订单支付处理
  async payOrder(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new MidwayHttpError('订单不存在', 404);
    if (order.cancelled) throw new MidwayHttpError('已取消', 400);
    if (order.status !== 'pending') throw new MidwayHttpError('订单状态异常', 400);
    // 余额支付
    if (order.pay_method === 'balance') {
      // 这里应调用UserService扣除余额，略
      order.status = 'delivering';
      order.pay_time = new Date();
      await this.orderRepo.save(order);
      // 支付后自动送达（仅非测试环境下注册定时器）
      if (process.env.NODE_ENV !== 'unittest') {
        setTimeout(async () => {
          const latest = await this.orderRepo.findOne({ where: { id: orderId } });
          if (latest && latest.status === 'delivering') {
            latest.status = 'delivered';
            await this.orderRepo.save(latest);
          }
        }, 30000); // 30秒
      }
      return { success: true, pay_method: 'balance' };
    }
    // 支付宝支付
    if (order.pay_method === 'alipay') {
      // 这里应调用支付宝SDK生成支付链接，略
      // 真实支付回调后再流转状态
      return { success: true, pay_method: 'alipay', payUrl: 'MOCK_ALIPAY_URL' };
    }
    throw new MidwayHttpError('不支持的支付方式', 400);
  }

  // 新增：确认收货并抽奖
  async confirmOrder(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new MidwayHttpError('订单不存在', 404);
    if (order.status !== 'delivered') throw new MidwayHttpError('订单未送达', 400);
    order.status = 'completed';
    await this.orderRepo.save(order);
    // 抽奖逻辑：为每个订单项分配商品（如未分配）
    const items = await this.orderItemRepo.find({ where: { order_id: orderId } });
    for (const item of items) {
      if (!item.item_id) {
        // 这里应实现抽奖算法，分配商品ID，简化为随机分配
        // item.item_id = ...
        // await this.orderItemRepo.save(item);
      }
    }
    return { success: true };
  }

  // 新增：查询用户所有已完成订单及获得商品
  async getCompletedOrdersWithItems(userId: number) {
    const orders = await this.orderRepo.find({
      where: { user_id: userId, status: 'completed' },
      order: { created_at: 'DESC' },
    });
    const result = [];
    for (const order of orders) {
      const items = await this.orderItemRepo.find({ where: { order_id: order.id } });
      result.push({ order, items });
    }
    return result;
  }

  // 用户打开盲盒（抽奖）
  async openOrderItem(orderItemId: number, userId: number, blindBoxService: BlindBoxService) {
    // 查找订单项
    const orderItem = await this.orderItemRepo.findOne({ where: { id: orderItemId } });
    if (!orderItem) throw new MidwayHttpError('订单项不存在', 404);
    // 查找订单
    const order = await this.orderRepo.findOne({ where: { id: orderItem.order_id } });
    if (!order) throw new MidwayHttpError('订单不存在', 404);
    if (order.user_id !== userId) throw new MidwayHttpError('无权操作该订单', 403);
    if (order.status !== 'completed') throw new MidwayHttpError('订单未完成，不能抽奖', 400);
    if (orderItem.item_id) throw new MidwayHttpError('该盲盒已打开', 400);
    // 调用盲盒抽奖逻辑
    const drawnItem = await blindBoxService.drawRandomItemByBoxId(orderItem.blind_box_id);
    orderItem.item_id = drawnItem.id;
    await this.orderItemRepo.save(orderItem);
    return { success: true, item: drawnItem };
  }
} 