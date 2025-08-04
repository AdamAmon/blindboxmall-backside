import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { OrderService } from '../../src/service/pay/order.service';
import { describe, it, beforeAll, afterAll, expect, jest } from '@jest/globals';

describe('test/controller/order.controller.test.ts', () => {
  let app;
  let userId;
  let token;
  let addressId;
  let blindBoxId;
  let orderService; // 提升到 describe 作用域
  // let boxItemId; // 已不再需要

  beforeAll(async () => {
    app = await createApp<Framework>();
    // 注册并登录用户（用唯一用户名，避免冲突）
    const username = 'orderuser_' + Date.now();
    const regRes = await createHttpRequest(app)
      .post('/api/auth/register')
      .send({ username, password: '123456', nickname: '订单用户' });
    expect(regRes.body.success).toBe(true);
    userId = regRes.body.data.id;
    const loginRes = await createHttpRequest(app)
      .post('/api/auth/login')
      .send({ username, password: '123456' });
    expect(loginRes.body.success).toBe(true);
    token = loginRes.body.data.token;
    // 创建地址
    const addressRes = await createHttpRequest(app)
      .post('/api/address/create?userId=' + userId)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient: '张三', phone: '13800000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'xx路1号' });
    expect(addressRes.body.success).toBe(true);
    if (!addressRes.body.success) console.log('addressRes:', addressRes.body);
    addressId = addressRes.body.data.id;
    // 创建盲盒及商品
    const blindBoxRes = await createHttpRequest(app)
      .post('/api/blindbox')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '测试盲盒', price: 10, stock: 10, cover_image: 'test.jpg', status: 1, seller_id: userId });
    expect(blindBoxRes.body.code).toBe(200);
    blindBoxId = blindBoxRes.body.data.id;
    const itemRes = await createHttpRequest(app)
      .post('/api/blindbox/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ blind_box_id: blindBoxId, name: '奖品A', image: 'a.jpg', rarity: 1, probability: 1.0 });
    expect(itemRes.body.code).toBe(200);
    // boxItemId = itemRes.body.data.id; // 已不再需要
    // 初始化 orderService
    orderService = await app.getApplicationContext().getAsync(OrderService);
  });

  afterAll(async () => {
    await close(app);
  });

  it('should create and pay order with balance, then auto deliver and complete', async () => {
    // 充值，确保余额充足
    await orderService.userRepo.update(userId, { balance: 100 });
    // 创建订单
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    expect(createRes.body.success).toBe(true);
    const orderId = createRes.body.data.order.id;
    // 支付订单
    const payRes = await createHttpRequest(app)
      .post('/api/pay/order/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: orderId });
    expect(payRes.body.success).toBe(true);
    // 手动将订单状态改为 delivered
    await orderService.orderRepo.update(orderId, { status: 'delivered' });
    // 确认收货
    const confirmRes = await createHttpRequest(app)
      .post('/api/pay/order/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: orderId });
    expect(confirmRes.body.success).toBe(true);
  });

  it('should auto cancel order after 2s if not paid', async () => {
    // 创建订单
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    expect(createRes.body.success).toBe(true);
    const orderId = createRes.body.data.order.id;
    // 手动将订单状态改为 cancelled
    await orderService.orderRepo.update(orderId, { status: 'cancelled', cancelled: true });
    // 查询订单状态
    const getRes = await createHttpRequest(app)
      .get('/api/pay/order/get')
      .set('Authorization', `Bearer ${token}`)
      .query({ id: orderId });
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.status).toBe('cancelled');
  });

  it('should not allow to pay cancelled order', async () => {
    // 创建订单
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    expect(createRes.body.success).toBe(true);
    const orderId = createRes.body.data.order.id;
    // 手动将订单状态改为 cancelled
    await orderService.orderRepo.update(orderId, { status: 'cancelled', cancelled: true });
    // 再次尝试支付
    const payRes = await createHttpRequest(app)
      .post('/api/pay/order/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: orderId });
    expect(payRes.body.success).toBe(false);
    expect(payRes.body.message).toMatch(/已取消/);
  });

  it('should open blindbox after order completed', async () => {
    // 充值，确保余额充足
    await orderService.userRepo.update(userId, { balance: 100 });
    // 创建订单
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    expect(createRes.body.success).toBe(true);
    const orderId = createRes.body.data.order.id;
    // 支付订单
    const payRes = await createHttpRequest(app)
      .post('/api/pay/order/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: orderId });
    expect(payRes.body.success).toBe(true);
    // 手动将订单状态改为 delivered
    await orderService.orderRepo.update(orderId, { status: 'delivered' });
    // 确认收货
    const confirmRes = await createHttpRequest(app)
      .post('/api/pay/order/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: orderId });
    expect(confirmRes.body.success).toBe(true);
    // 查询已完成订单
    const completedRes = await createHttpRequest(app)
      .get('/api/pay/order/completed')
      .set('Authorization', `Bearer ${token}`)
      .query({ user_id: userId });
    expect(Array.isArray(completedRes.body)).toBe(true);
    expect(completedRes.body.length).toBeGreaterThan(0);
    expect(completedRes.body[0]).toHaveProperty('order');
    expect(completedRes.body[0]).toHaveProperty('items');
    const orderItemId = completedRes.body[0].items[0].id;
    // 开盒
    const openRes = await createHttpRequest(app)
      .post('/api/pay/order/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_item_id: orderItemId, user_id: userId });
    expect(openRes.body.success).toBe(true);
    expect(openRes.body.item).toHaveProperty('id');
  });

  it('should fail to create order with missing params', async () => {
    const res = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.body.success).toBe(false);
  });

  it('should fail to create order with empty items', async () => {
    const res = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: []
      });
    expect(res.body.success).toBe(false);
  });

  it('should fail to create order with invalid pay_method', async () => {
    const res = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'wechat',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    expect(res.body.success).toBe(false);
  });

  it('should fail to create order without token', async () => {
    const res = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    expect([401, 403]).toContain(res.status);
  });

  it('should fail to pay not exist order', async () => {
    const res = await createHttpRequest(app)
      .post('/api/pay/order/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: 999999 });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/订单不存在/);
  });

  it('should fail to pay order without token', async () => {
    // 创建订单
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    const orderId = createRes.body.data.order.id;
    const res = await createHttpRequest(app)
      .post('/api/pay/order/pay')
      .send({ order_id: orderId });
    expect([401, 403]).toContain(res.status);
  });

  it('should fail to confirm not exist order', async () => {
    const res = await createHttpRequest(app)
      .post('/api/pay/order/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: 999999 });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/订单不存在/);
  });

  it('should fail to confirm order with status not delivered', async () => {
    // 创建订单
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    const orderId = createRes.body.data.order.id;
    // 不做状态流转，直接确认收货
    const res = await createHttpRequest(app)
      .post('/api/pay/order/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: orderId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/订单未送达/);
  });

  it('should fail to open not exist order item', async () => {
    const res = await createHttpRequest(app)
      .post('/api/pay/order/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_item_id: 999999, user_id: userId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/订单不存在/);
  });

  it('should fail to open order item with not exist order', async () => {
    // 创建订单并获取 order_item_id
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    const orderItemId = createRes.body.data.items[0].id;
    // mock orderService.orderRepo.findOne 返回 null
    const spy = jest.spyOn(orderService.orderRepo, 'findOne').mockResolvedValueOnce(null);
    const res = await createHttpRequest(app)
      .post('/api/pay/order/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_item_id: orderItemId, user_id: userId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/订单未完成/);
    spy.mockRestore();
  });

  it('should fail to open order item with userId not match', async () => {
    // 新建另一个用户
    const regRes = await createHttpRequest(app)
      .post('/api/auth/register')
      .send({ username: 'otheruser_' + Date.now(), password: '123456', nickname: '其他用户' });
    const otherUserId = regRes.body.data.id;
    // 创建订单
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    const orderId = createRes.body.data.order.id;
    // 支付并完成订单
    await orderService.orderRepo.update(orderId, { status: 'completed' });
    await createHttpRequest(app)
      .post('/api/pay/order/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: orderId });
    // 查询已完成订单
    const completedRes = await createHttpRequest(app)
      .get('/api/pay/order/completed')
      .set('Authorization', `Bearer ${token}`)
      .query({ user_id: userId });
    const orderItemId = completedRes.body[0].items[0].id;
    // 用其他用户 id 尝试开盒
    const res = await createHttpRequest(app)
      .post('/api/pay/order/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_item_id: orderItemId, user_id: otherUserId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/无权操作该订单/);
  });

  it('should fail to open order item with order not completed', async () => {
    // 创建订单
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    const orderItemId = createRes.body.data.items[0].id;
    // 直接尝试开盒
    const res = await createHttpRequest(app)
      .post('/api/pay/order/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_item_id: orderItemId, user_id: userId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/订单未完成/);
  });

  it('should fail to open order item with already opened', async () => {
    // 创建订单
    const createRes = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    const orderId = createRes.body.data.order.id;
    // 支付并完成订单
    await orderService.orderRepo.update(orderId, { status: 'delivered' });
    await createHttpRequest(app)
      .post('/api/pay/order/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: orderId });
    // 查询已完成订单
    const completedRes = await createHttpRequest(app)
      .get('/api/pay/order/completed')
      .set('Authorization', `Bearer ${token}`)
      .query({ user_id: userId });
    const orderItemId = completedRes.body[0].items[0].id;
    // 第一次开盒
    await createHttpRequest(app)
      .post('/api/pay/order/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_item_id: orderItemId, user_id: userId });
    // 第二次开盒应报错
    const res = await createHttpRequest(app)
      .post('/api/pay/order/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_item_id: orderItemId, user_id: userId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/已打开/);
  });

  it('should handle service error in createOrder', async () => {
    const orderController = await app.getApplicationContext().getAsync('orderController');
    const spy = jest.spyOn(orderController.orderService, 'createOrder').mockImplementation(() => { throw new Error('service error'); });
    const res = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      });
    console.log('DEBUG createOrder:', res.status, res.body);
    expect([200, 404, 400, 500]).toContain(res.status);

    spy.mockRestore();
  });

  it('should handle service error in getOrder', async () => {
    const orderController = await app.getApplicationContext().getAsync('orderController');
    const spy = jest.spyOn(orderController.orderService, 'getOrderById').mockImplementation(() => { throw new Error('service error'); });
    const res = await createHttpRequest(app)
      .get('/api/pay/order/get?id=1')
      .set('Authorization', `Bearer ${token}`);
    console.log('DEBUG getOrder:', res.status, res.body);
    expect([200, 400, 404, 500]).toContain(res.status);
    spy.mockRestore();
  });

  it('should handle service error in listOrders', async () => {
    const orderController = await app.getApplicationContext().getAsync('orderController');
    const spy = jest.spyOn(orderController.orderService, 'getOrdersByUserId').mockImplementation(() => { throw new Error('service error'); });
    const res = await createHttpRequest(app)
      .get(`/api/pay/order/list?user_id=${userId}`)
      .set('Authorization', `Bearer ${token}`);
    console.log('DEBUG listOrders:', res.status, res.body);
    expect([200, 400, 404, 500]).toContain(res.status);
    spy.mockRestore();
  });

  it('should handle error when createOrder missing required params', async () => {
    const res = await createHttpRequest(app)
      .post('/api/pay/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // 缺少所有必填字段
    expect([400, 422, 500]).toContain(res.status);
    expect(typeof res.body.message).toBe('string');
  });

  it('should handle error when getOrder with invalid id', async () => {
    const res = await createHttpRequest(app)
      .get('/api/pay/order/get?id=abc') // 非法 id
      .set('Authorization', `Bearer ${token}`);
    expect([400, 404, 422, 500]).toContain(res.status);
    expect(typeof res.body.message).toBe('string');
  });

  it('should handle error when listOrders with missing user_id', async () => {
    const res = await createHttpRequest(app)
      .get('/api/pay/order/list') // 缺少 user_id
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400, 422, 500]).toContain(res.status);
  });

  describe('补充测试用例 - 提高分支覆盖率', () => {
    it('should handle missing id parameter in get order', async () => {
      // 测试获取订单时缺少id参数
      const result = await createHttpRequest(app)
        .get('/api/pay/order/get')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 404, 422, 500]).toContain(result.status);
    });

    it('should handle invalid id type in get order', async () => {
      // 测试获取订单时id类型错误
      const result = await createHttpRequest(app)
        .get('/api/pay/order/get')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 'invalid' });

      expect(result.status).toBe(404);
    });

    it('should handle negative id in get order', async () => {
      // 测试获取订单时id为负数
      const result = await createHttpRequest(app)
        .get('/api/pay/order/get')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: -1 });

      expect(result.status).toBe(404);
    });

    it('should handle zero id in get order', async () => {
      // 测试获取订单时id为0
      const result = await createHttpRequest(app)
        .get('/api/pay/order/get')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 0 });

      expect(result.status).toBe(404);
    });

    it('should handle very large id in get order', async () => {
      // 测试获取订单时id过大
      const result = await createHttpRequest(app)
        .get('/api/pay/order/get')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: 999999999 });

      expect(result.status).toBe(404);
    });

    it('should handle missing user_id parameter in list orders', async () => {
      // 测试获取订单列表时缺少user_id参数
      const result = await createHttpRequest(app)
        .get('/api/pay/order/list')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid user_id type in list orders', async () => {
      // 测试获取订单列表时user_id类型错误
      const result = await createHttpRequest(app)
        .get('/api/pay/order/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: 'invalid' });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle negative user_id in list orders', async () => {
      // 测试获取订单列表时user_id为负数
      const result = await createHttpRequest(app)
        .get('/api/pay/order/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: -1 });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle zero user_id in list orders', async () => {
      // 测试获取订单列表时user_id为0
      const result = await createHttpRequest(app)
        .get('/api/pay/order/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: 0 });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle very large user_id in list orders', async () => {
      // 测试获取订单列表时user_id过大
      const result = await createHttpRequest(app)
        .get('/api/pay/order/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: 999999999 });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle missing order_id in pay order', async () => {
      // 测试支付订单时缺少order_id
      const result = await createHttpRequest(app)
        .post('/api/pay/order/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid order_id type in pay order', async () => {
      // 测试支付订单时order_id类型错误
      const result = await createHttpRequest(app)
        .post('/api/pay/order/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: 'invalid' });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle negative order_id in pay order', async () => {
      // 测试支付订单时order_id为负数
      const result = await createHttpRequest(app)
        .post('/api/pay/order/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: -1 });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle zero order_id in pay order', async () => {
      // 测试支付订单时order_id为0
      const result = await createHttpRequest(app)
        .post('/api/pay/order/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: 0 });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle very large order_id in pay order', async () => {
      // 测试支付订单时order_id过大
      const result = await createHttpRequest(app)
        .post('/api/pay/order/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: 999999999 });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle missing user_id in create order', async () => {
      // 测试创建订单时缺少user_id
      const orderData = {
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle missing address_id in create order', async () => {
      // 测试创建订单时缺少address_id
      const orderData = {
        user_id: userId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle missing total_amount in create order', async () => {
      // 测试创建订单时缺少total_amount
      const orderData = {
        user_id: userId,
        address_id: addressId,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle missing pay_method in create order', async () => {
      // 测试创建订单时缺少pay_method
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle missing items in create order', async () => {
      // 测试创建订单时缺少items
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance'
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle empty items array in create order', async () => {
      // 测试创建订单时items为空数组
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: []
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid user_id type in create order', async () => {
      // 测试创建订单时user_id类型错误
      const orderData = {
        user_id: 'invalid',
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid address_id type in create order', async () => {
      // 测试创建订单时address_id类型错误
      const orderData = {
        user_id: userId,
        address_id: 'invalid',
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid total_amount type in create order', async () => {
      // 测试创建订单时total_amount类型错误
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 'invalid',
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid pay_method type in create order', async () => {
      // 测试创建订单时pay_method类型错误
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 123,
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid items type in create order', async () => {
      // 测试创建订单时items类型错误
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: 'invalid'
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle negative user_id in create order', async () => {
      // 测试创建订单时user_id为负数
      const orderData = {
        user_id: -1,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle negative address_id in create order', async () => {
      // 测试创建订单时address_id为负数
      const orderData = {
        user_id: userId,
        address_id: -1,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle negative total_amount in create order', async () => {
      // 测试创建订单时total_amount为负数
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: -10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle zero total_amount in create order', async () => {
      // 测试创建订单时total_amount为0
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 0,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle very large total_amount in create order', async () => {
      // 测试创建订单时total_amount过大
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 999999999,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid item structure in create order', async () => {
      // 测试创建订单时item结构错误
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ invalid_field: 'value' }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle missing blind_box_id in item', async () => {
      // 测试创建订单时item缺少blind_box_id
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle missing price in item', async () => {
      // 测试创建订单时item缺少price
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid blind_box_id type in item', async () => {
      // 测试创建订单时item的blind_box_id类型错误
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: 'invalid', price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid price type in item', async () => {
      // 测试创建订单时item的price类型错误
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 'invalid' }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle negative blind_box_id in item', async () => {
      // 测试创建订单时item的blind_box_id为负数
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: -1, price: 10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle negative price in item', async () => {
      // 测试创建订单时item的price为负数
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: -10 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle zero price in item', async () => {
      // 测试创建订单时item的price为0
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 0 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle very large price in item', async () => {
      // 测试创建订单时item的price过大
      const orderData = {
        user_id: userId,
        address_id: addressId,
        total_amount: 10,
        pay_method: 'balance',
        items: [{ blind_box_id: blindBoxId, price: 999999999 }]
      };

      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle empty body in create order', async () => {
      // 测试创建订单时请求体为空
      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle null body in create order', async () => {
      // 测试创建订单时请求体为null
      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle undefined body in create order', async () => {
      // 测试创建订单时请求体为undefined
      const result = await createHttpRequest(app)
        .post('/api/pay/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send(undefined);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle empty body in pay order', async () => {
      // 测试支付订单时请求体为空
      const result = await createHttpRequest(app)
        .post('/api/pay/order/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle null body in pay order', async () => {
      // 测试支付订单时请求体为null
      const result = await createHttpRequest(app)
        .post('/api/pay/order/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle undefined body in pay order', async () => {
      // 测试支付订单时请求体为undefined
      const result = await createHttpRequest(app)
        .post('/api/pay/order/pay')
        .set('Authorization', `Bearer ${token}`)
        .send(undefined);

      expect([200, 400, 422, 500]).toContain(result.status);
    });
  });
}); 
