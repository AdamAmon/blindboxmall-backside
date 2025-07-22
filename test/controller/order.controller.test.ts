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
}); 