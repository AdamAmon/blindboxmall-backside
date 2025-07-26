import { Provide, Config } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entity/pay/order.entity';
import { OrderItem } from '../../entity/pay/order-item.entity';
import { CreateOrderDTO, CreateOrderItemDTO } from '../../dto/pay/order.dto';
import { MidwayHttpError } from '@midwayjs/core';
import { BlindBoxService } from '../blindbox/blindbox.service';
import { User } from '../../entity/user/user.entity';
import { BlindBox } from '../../entity/blindbox/blindbox.entity';
import { UserCoupon } from '../../entity/coupon/user-coupon.entity';
import { Coupon } from '../../entity/coupon/coupon.entity';
import { AlipaySdk } from 'alipay-sdk';

@Provide()
export class OrderService {
  @InjectEntityModel(Order)
  orderRepo: Repository<Order>;

  @InjectEntityModel(OrderItem)
  orderItemRepo: Repository<OrderItem>;

  @InjectEntityModel(User)
  userRepo: Repository<User>;

  @InjectEntityModel(BlindBox)
  blindBoxRepo: Repository<BlindBox>;

  @InjectEntityModel(UserCoupon)
  userCouponRepo: Repository<UserCoupon>;

  @InjectEntityModel(Coupon)
  couponRepo: Repository<Coupon>;

  @Config('alipay')
  alipayConfig;

  getAlipaySdk() {
    return new AlipaySdk({
      appId: this.alipayConfig.appId,
      privateKey: this.alipayConfig.privateKey,
      alipayPublicKey: this.alipayConfig.alipayPublicKey,
      gateway: this.alipayConfig.gateway,
      signType: 'RSA2',
      keyType: 'PKCS8',
      timeout: 5000,
      camelcase: true,
    });
  }

  // 验证优惠券
  async validateCoupon(userCouponId: number, userId: number, totalAmount: number) {
    if (!userCouponId) return { valid: true, discount: 0 };
    
    const userCoupon = await this.userCouponRepo.findOne({
      where: { id: userCouponId, user_id: userId },
      relations: ['coupon']
    });
    
    if (!userCoupon) {
      throw new MidwayHttpError('优惠券不存在', 400);
    }
    
    if (userCoupon.status !== 0) {
      throw new MidwayHttpError('优惠券已使用或已过期', 400);
    }
    
    const now = new Date();
    if (now < userCoupon.coupon.start_time || now > userCoupon.coupon.end_time) {
      throw new MidwayHttpError('优惠券不在有效期内', 400);
    }
    
    let discount = 0;
    if (userCoupon.coupon.type === 1) {
      // 满减券
      if (totalAmount >= userCoupon.coupon.threshold) {
        discount = userCoupon.coupon.amount;
      }
    } else if (userCoupon.coupon.type === 2) {
      // 折扣券
      discount = Number((totalAmount * (1 - userCoupon.coupon.amount)).toFixed(2));
    }
    
    return { valid: true, discount, userCoupon };
  }

  // 创建订单及订单项（支持批量）
  async createOrder(dto: CreateOrderDTO) {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new MidwayHttpError('订单项不能为空', 400);
    }
    
    // 计算原始总金额
    const originalAmount = dto.items.reduce((sum, item) => sum + item.price, 0);
    
    // 验证优惠券
    let discountAmount = 0;
    let userCoupon = null;
    if (dto.user_coupon_id) {
      const validation = await this.validateCoupon(dto.user_coupon_id, dto.user_id, originalAmount);
      if (!validation.valid) {
        throw new MidwayHttpError('优惠券验证失败', 400);
      }
      discountAmount = validation.discount;
      userCoupon = validation.userCoupon;
    }
    
    // 验证最终金额
    const finalAmount = originalAmount - discountAmount;
    if (finalAmount !== dto.total_amount) {
      throw new MidwayHttpError('订单金额计算错误', 400);
    }
    
    // 创建订单
    const order = this.orderRepo.create({
      user_id: dto.user_id,
      address_id: dto.address_id,
      total_amount: dto.total_amount,
      status: 'pending',
      pay_method: dto.pay_method,
      cancelled: false,
      user_coupon_id: dto.user_coupon_id,
      discount_amount: discountAmount,
    });
    const savedOrder = await this.orderRepo.save(order);
    
    // 创建订单项（支持批量）
    const items = dto.items.map((item: CreateOrderItemDTO) =>
      this.orderItemRepo.create({
        order_id: savedOrder.id,
        blind_box_id: item.blind_box_id,
        item_id: null, // 未开盒
        price: item.price,
        is_opened: false,
        opened_at: null,
      })
    );
    await this.orderItemRepo.save(items);
    
    // 如果使用了优惠券，标记为已使用
    if (userCoupon) {
      userCoupon.status = 1;
      userCoupon.used_at = new Date();
      await this.userCouponRepo.save(userCoupon);
    }
    
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
    
    // 补全每个订单项的盲盒详情
    for (const item of order.orderItems) {
      const blindBox = await this.blindBoxRepo.findOne({ where: { id: item.blind_box_id } });
      item.blindBox = blindBox;
    }
    
    // 如果使用了优惠券，获取优惠券详情
    if (order.user_coupon_id) {
      const userCoupon = await this.userCouponRepo.findOne({
        where: { id: order.user_coupon_id },
        relations: ['coupon']
      });
      order.user_coupon = userCoupon;
    }
    
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
      // 查询用户并扣除余额
      const user = await this.userRepo.findOne({ where: { id: order.user_id } });
      if (!user) throw new MidwayHttpError('用户不存在', 404);
      if (Number(user.balance) < Number(order.total_amount)) throw new MidwayHttpError('余额不足', 400);
      user.balance = Number(user.balance) - Number(order.total_amount);
      await this.userRepo.save(user);
      order.status = 'delivering';
      order.pay_time = new Date();
      await this.orderRepo.save(order);
      // 扣减库存
      const items = await this.orderItemRepo.find({ where: { order_id: orderId } });
      for (const item of items) {
        const blindBox = await this.blindBoxRepo.findOne({ where: { id: item.blind_box_id } });
        if (blindBox) {
          blindBox.stock = Math.max(0, blindBox.stock - 1);
          await this.blindBoxRepo.save(blindBox);
        }
      }
      // 支付后自动送达（仅非测试环境下注册定时器）
      if (process.env.NODE_ENV !== 'unittest' && process.env.NODE_ENV !== 'test') {
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
      // 生成支付宝支付链接
      let outTradeNo = order.out_trade_no;
      if (!outTradeNo) {
        outTradeNo = 'ORDER' + Date.now() + Math.floor(Math.random() * 10000);
        order.out_trade_no = outTradeNo;
        await this.orderRepo.save(order);
      }
      const alipaySdk = this.getAlipaySdk();
      const bizContent = {
        subject: '盲盒商城订单',
        out_trade_no: outTradeNo,
        total_amount: Number(order.total_amount).toFixed(2),
        product_code: 'FAST_INSTANT_TRADE_PAY',
      };
      let payUrl;
      try {
        payUrl = await alipaySdk.pageExecute('alipay.trade.page.pay', 'GET', {
          bizContent,
          notifyUrl: this.alipayConfig.notifyUrl.replace('/notify', '/order/notify'),
        });
      } catch (err) {
        throw new MidwayHttpError('支付宝下单失败: ' + err.message, 500);
      }
      return { success: true, pay_method: 'alipay', payUrl };
    }
    throw new MidwayHttpError('不支持的支付方式', 400);
  }

  // 新增：支付宝异步回调接口
  async handleAlipayNotify(rawBody: string) {
    // 解析参数
    const params = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    console.log('[支付宝回调] 收到参数:', params);
    if (!params.out_trade_no) {
      console.error('[支付宝回调] 缺少out_trade_no参数:', params);
      throw new MidwayHttpError('缺少out_trade_no参数', 400);
    }
    if (params.trade_status !== 'TRADE_SUCCESS') {
      console.log('[支付宝回调] trade_status非TRADE_SUCCESS:', params.trade_status);
      return 'success';
    }
    // 校验签名
    try {
      const alipaySdk = this.getAlipaySdk();
      const isValid = alipaySdk.checkNotifySignV2(params);
      if (!isValid) {
        // 签名失败可记录日志
        console.warn('[支付宝回调] 签名校验失败:', params);
      }
    } catch (e) {
      // 校验签名异常可记录日志
      console.error('[支付宝回调] 签名校验异常:', e, params);
    }
    // 查找订单
    const order = await this.orderRepo.findOne({ where: { out_trade_no: params.out_trade_no } });
    if (!order) {
      console.error('[支付宝回调] 未找到订单 out_trade_no:', params.out_trade_no);
      throw new MidwayHttpError('订单不存在', 404);
    }
    if (order.status !== 'pending') {
      console.log('[支付宝回调] 订单已处理，当前状态:', order.status);
      return 'success';
    }
    order.status = 'delivering';
    order.pay_time = new Date();
    order.alipay_trade_no = params.trade_no;
    await this.orderRepo.save(order);
    // 扣减库存
    const items = await this.orderItemRepo.find({ where: { order_id: order.id } });
    for (const item of items) {
      const blindBox = await this.blindBoxRepo.findOne({ where: { id: item.blind_box_id } });
      if (blindBox) {
        blindBox.stock = Math.max(0, blindBox.stock - 1);
        await this.blindBoxRepo.save(blindBox);
      }
    }
    // 自动送达
    if (process.env.NODE_ENV !== 'unittest' && process.env.NODE_ENV !== 'test') {
      setTimeout(async () => {
        const latest = await this.orderRepo.findOne({ where: { id: order.id } });
        if (latest && latest.status === 'delivering') {
          latest.status = 'delivered';
          await this.orderRepo.save(latest);
        }
      }, 30000);
    }
    console.log('[支付宝回调] 订单状态已更新为delivering，订单ID:', order.id);
    return 'success';
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
      // join 出 item 字段
      const items = await this.orderItemRepo.find({ where: { order_id: order.id }, relations: ['item'] });
      result.push({ order, items });
    }
    return result;
  }

  // 开盒逻辑，支持逐个开盒
  async openOrderItem(orderItemId: number, userId: number, blindBoxService: BlindBoxService) {
    const orderItem = await this.orderItemRepo.findOne({ where: { id: orderItemId }, relations: ['order'] });
    if (!orderItem) throw new MidwayHttpError('订单不存在', 404);
    if (orderItem.order.user_id !== userId) throw new MidwayHttpError('无权操作该订单', 403);
    if (orderItem.is_opened) throw new MidwayHttpError('该盲盒已打开', 400);
    // 仅允许已完成订单开盒
    if (orderItem.order.status !== 'completed') throw new MidwayHttpError('订单未完成', 400);
    // 抽奖逻辑
    const boxItem = await blindBoxService.drawRandomItemByBoxId(orderItem.blind_box_id);
    orderItem.item_id = boxItem.id;
    orderItem.is_opened = true;
    orderItem.opened_at = new Date();
    await this.orderItemRepo.save(orderItem);
    return boxItem;
  }
} 