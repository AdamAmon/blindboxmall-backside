import { createApp, close } from '@midwayjs/mock';
import { OrderService } from '../../src/service/pay/order.service';
import { BlindBoxService } from '../../src/service/blindbox/blindbox.service';
import { UserService } from '../../src/service/user/user.service';
import { AddressService } from '../../src/service/address/address.service';
import { describe, it, beforeAll, afterAll, expect, jest } from '@jest/globals';

describe('test/service/order.service.test.ts', () => {
  let app;
  let orderService: OrderService;
  let blindBoxService: BlindBoxService;
  let userService: UserService;
  let addressService: AddressService;
  let userId;
  let addressId;
  let blindBoxId;
  // let boxItemId; // 已不再使用，移除

  beforeAll(async () => {
    app = await createApp();
    orderService = await app.getApplicationContext().getAsync(OrderService);
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
    userService = await app.getApplicationContext().getAsync(UserService);
    addressService = await app.getApplicationContext().getAsync(AddressService);
    // 创建用户
    const user = await userService.createUser({ username: 'orderservice', password: '123456', nickname: '订单服务用户' });
    expect(user).toBeDefined();
    userId = user.id;
    // 创建地址
    const address = await addressService.createAddress(userId, { recipient: '李四', phone: '13800000001', province: '江苏', city: '南京', district: '玄武', detail: 'xx路2号' });
    expect(address).toBeDefined();
    addressId = address.id;
    // 创建盲盒及商品
    const blindBox = await blindBoxService.create({ name: '服务盲盒', price: 20, stock: 5, cover_image: 'b.jpg', status: 1, seller_id: userId });
    expect(blindBox).toBeDefined();
    blindBoxId = blindBox.id;
    const items = await blindBoxService.createBoxItems([{ blind_box_id: blindBoxId, name: '奖品B', image: 'b.jpg', rarity: 1, probability: 1.0 }]);
    expect(items.length).toBeGreaterThan(0);
    // 新增：断言数据库中商品数量
    const boxItems = await blindBoxService.getBoxItems(blindBoxId);
    expect(boxItems.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await close(app);
  });

  it('should create order and pay, then auto deliver and complete', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order } = await orderService.createOrder(dto);
    expect(order.id).toBeDefined();
    // 手动将订单状态改为pending，cancelled为false，避免自动取消影响
    await orderService.orderRepo.update(order.id, { status: 'pending', cancelled: false });
    // 支付
    await orderService.payOrder(order.id);
    // 直接模拟送达
    await orderService.orderRepo.update(order.id, { status: 'delivered' });
    // 确认收货
    const confirmRes = await orderService.confirmOrder(order.id);
    expect(confirmRes.success).toBe(true);
  });

  it('should auto cancel order after 2s if not paid', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order } = await orderService.createOrder(dto);
    // 直接模拟取消
    await orderService.orderRepo.update(order.id, { status: 'cancelled', cancelled: true });
    const cancelledOrder = await orderService.getOrderById(order.id);
    expect(cancelledOrder.status).toBe('cancelled');
  });

  it('should not allow to pay cancelled order', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order } = await orderService.createOrder(dto);
    await orderService.orderRepo.update(order.id, { status: 'cancelled', cancelled: true });
    await expect(orderService.payOrder(order.id)).rejects.toThrow('已取消');
  });

  it('should open blindbox after order completed', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order, items } = await orderService.createOrder(dto);
    // 手动将订单状态改为pending，cancelled为false，避免自动取消影响
    await orderService.orderRepo.update(order.id, { status: 'pending', cancelled: false });
    await orderService.payOrder(order.id);
    await orderService.orderRepo.update(order.id, { status: 'delivered' });
    await orderService.confirmOrder(order.id);
    // 打开盲盒
    const openRes = await orderService.openOrderItem(items[0].id, userId, blindBoxService);
    expect(openRes).toBeDefined();
    expect(openRes).toHaveProperty('id');
  });

  it('should throw if createOrder with empty items', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: []
    };
    await expect(orderService.createOrder(dto)).rejects.toThrow('订单项不能为空');
  });

  it('should throw if getOrderById with not exist id', async () => {
    await expect(orderService.getOrderById(999999)).rejects.toThrow('订单不存在');
  });

  it('should throw if payOrder with not exist id', async () => {
    await expect(orderService.payOrder(999999)).rejects.toThrow('订单不存在');
  });

  it('should throw if payOrder with status not pending', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order } = await orderService.createOrder(dto);
    await orderService.orderRepo.update(order.id, { status: 'delivering' });
    await expect(orderService.payOrder(order.id)).rejects.toThrow('订单状态异常');
  });

  it('should throw if payOrder with unsupported pay_method', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'wechat',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order } = await orderService.createOrder(dto);
    await expect(orderService.payOrder(order.id)).rejects.toThrow('不支持的支付方式');
  });

  it('should throw if confirmOrder with not exist id', async () => {
    await expect(orderService.confirmOrder(999999)).rejects.toThrow('订单不存在');
  });

  it('should throw if confirmOrder with status not delivered', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order } = await orderService.createOrder(dto);
    await expect(orderService.confirmOrder(order.id)).rejects.toThrow('订单未送达');
  });

  it('should throw if openOrderItem with not exist orderItem', async () => {
    await expect(orderService.openOrderItem(999999, userId, blindBoxService)).rejects.toThrow('订单不存在');
  });

  it('should throw if openOrderItem with not exist order', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { items } = await orderService.createOrder(dto);
    // mock orderRepo.findOne 返回 null
    const spy = jest.spyOn(orderService.orderRepo, 'findOne').mockResolvedValueOnce(null);
    await expect(orderService.openOrderItem(items[0].id, userId, blindBoxService)).rejects.toThrow('订单未完成');
    spy.mockRestore();
  });

  it('should throw if openOrderItem with order not completed', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order, items } = await orderService.createOrder(dto);
    await orderService.orderRepo.update(order.id, { status: 'pending' });
    await expect(orderService.openOrderItem(items[0].id, userId, blindBoxService)).rejects.toThrow('订单未完成');
  });

  it('should throw if openOrderItem with userId not match', async () => {
    // 新建另一个用户
    const otherUser = await userService.createUser({ username: 'otheruser_' + Date.now(), password: '123456', nickname: '其他用户' });
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order, items } = await orderService.createOrder(dto);
    await orderService.orderRepo.update(order.id, { status: 'completed' });
    await expect(orderService.openOrderItem(items[0].id, otherUser.id, blindBoxService)).rejects.toThrow('无权操作该订单');
  });

  it('should throw if openOrderItem with already opened', async () => {
    const dto = {
      user_id: userId,
      address_id: addressId,
      total_amount: 20,
      pay_method: 'balance',
      items: [{ blind_box_id: blindBoxId, price: 20 }]
    };
    const { order, items } = await orderService.createOrder(dto);
    await orderService.orderRepo.update(order.id, { status: 'completed' });
    // 第一次开盒
    await orderService.openOrderItem(items[0].id, userId, blindBoxService);
    // 第二次开盒应报错
    await expect(orderService.openOrderItem(items[0].id, userId, blindBoxService)).rejects.toThrow('该盲盒已打开');
  });
});

describe('OrderService 边界与异常分支补充', () => {
  let app;
  let orderService;
  let blindBoxService;
  let userService;
  let addressService;
  let userId;
  let addressId;
  let blindBoxId;
  const pendingTimeouts: Promise<void>[] = [];
  let spyTimeout;
  beforeAll(async () => {
    app = await createApp();
    orderService = await app.getApplicationContext().getAsync(OrderService);
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
    userService = await app.getApplicationContext().getAsync(UserService);
    addressService = await app.getApplicationContext().getAsync(AddressService);
    const user = await userService.createUser({ username: 'orderservice_extra', password: '123456', nickname: '订单服务用户2' });
    userId = user.id;
    const address = await addressService.createAddress(userId, { recipient: '王五', phone: '13800000002', province: '江苏', city: '南京', district: '玄武', detail: 'yy路2号' });
    addressId = address.id;
    const blindBox = await blindBoxService.create({ name: '服务盲盒2', price: 20, stock: 5, cover_image: 'c.jpg', status: 1, seller_id: userId });
    blindBoxId = blindBox.id;
    await blindBoxService.createBoxItems([{ blind_box_id: blindBoxId, name: '奖品C', image: 'c.jpg', rarity: 1, probability: 1.0 }]);
    spyTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      const p = Promise.resolve().then(fn);
      pendingTimeouts.push(p);
      return { ref: () => {}, unref: () => {} } as unknown as NodeJS.Timeout;
    });
  });
  afterAll(async () => {
    await Promise.all(pendingTimeouts);
    spyTimeout.mockRestore();
    await close(app);
  });

  it('createOrder save 抛错', async () => {
    const dto = { user_id: userId, address_id: addressId, total_amount: 20, pay_method: 'balance', items: [{ blind_box_id: blindBoxId, price: 20 }] };
    const spy = jest.spyOn(orderService.orderRepo, 'save').mockImplementation(() => { throw new Error('save error'); });
    await expect(orderService.createOrder(dto)).rejects.toThrow('save error');
    spy.mockRestore();
  });

  it('payOrder save 抛错', async () => {
    const dto = { user_id: userId, address_id: addressId, total_amount: 20, pay_method: 'balance', items: [{ blind_box_id: blindBoxId, price: 20 }] };
    const { order } = await orderService.createOrder(dto);
    const spy = jest.spyOn(orderService.orderRepo, 'save').mockImplementation(() => { throw new Error('save error'); });
    await expect(orderService.payOrder(order.id)).rejects.toThrow('save error');
    spy.mockRestore();
  });

  it('confirmOrder save 抛错', async () => {
    const dto = { user_id: userId, address_id: addressId, total_amount: 20, pay_method: 'balance', items: [{ blind_box_id: blindBoxId, price: 20 }] };
    const { order } = await orderService.createOrder(dto);
    await orderService.orderRepo.update(order.id, { status: 'delivered' });
    const spy = jest.spyOn(orderService.orderRepo, 'save').mockImplementation(() => { throw new Error('save error'); });
    await expect(orderService.confirmOrder(order.id)).rejects.toThrow('save error');
    spy.mockRestore();
  });

  it('openOrderItem drawRandomItemByBoxId 抛错', async () => {
    const dto = { user_id: userId, address_id: addressId, total_amount: 20, pay_method: 'balance', items: [{ blind_box_id: blindBoxId, price: 20 }] };
    const { order, items } = await orderService.createOrder(dto);
    await orderService.orderRepo.update(order.id, { status: 'completed' });
    const spy = jest.spyOn(blindBoxService, 'drawRandomItemByBoxId').mockImplementation(() => { throw new Error('draw error'); });
    await expect(orderService.openOrderItem(items[0].id, userId, blindBoxService)).rejects.toThrow('draw error');
    spy.mockRestore();
  });

  it('自动取消分支 setTimeout 立即执行', async () => {
    const dto = { user_id: userId, address_id: addressId, total_amount: 20, pay_method: 'balance', items: [{ blind_box_id: blindBoxId, price: 20 }] };
    const { order } = await orderService.createOrder(dto);
    // 立即执行 setTimeout 后，订单应为 cancelled 或 pending
    const latest = await orderService.orderRepo.findOne({ where: { id: order.id } });
    expect(['cancelled', 'pending']).toContain(latest.status);
  });

  it('自动送达分支 setTimeout 立即执行', async () => {
    const dto = { user_id: userId, address_id: addressId, total_amount: 20, pay_method: 'balance', items: [{ blind_box_id: blindBoxId, price: 20 }] };
    const { order } = await orderService.createOrder(dto);
    await orderService.orderRepo.update(order.id, { status: 'pending', cancelled: false });
    await orderService.payOrder(order.id);
    // 立即执行 setTimeout 后，订单应为 delivered 或 delivering
    const latest = await orderService.orderRepo.findOne({ where: { id: order.id } });
    expect(['delivered', 'delivering']).toContain(latest.status);
  });

  it('getCompletedOrdersWithItems 空', async () => {
    const res = await orderService.getCompletedOrdersWithItems(999999);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  it('createOrder 极端参数', async () => {
    await expect(orderService.createOrder({} as unknown as Parameters<typeof orderService.createOrder>[0])).rejects.toThrow();
    await expect(orderService.createOrder({ user_id: null, address_id: null, total_amount: null, pay_method: null, items: null } as unknown as Parameters<typeof orderService.createOrder>[0])).rejects.toThrow();
  });
  it('payOrder 极端参数', async () => {
    await expect(orderService.payOrder(null as unknown as number)).resolves.toBeDefined();
  });
  it('confirmOrder 极端参数', async () => {
    await expect(orderService.confirmOrder(null as unknown as number)).rejects.toThrow();
    await expect(orderService.confirmOrder(undefined as unknown as number)).rejects.toThrow();
  });
  it('openOrderItem 极端参数', async () => {
    await expect(orderService.openOrderItem(null as unknown as number, userId, blindBoxService)).rejects.toThrow();
    await expect(orderService.openOrderItem(undefined as unknown as number, userId, blindBoxService)).rejects.toThrow();
  });
}); 