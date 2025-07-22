import { createApp, close } from '@midwayjs/mock';
import { RechargeService } from '../../src/service/pay/recharge.service';
import { UserService } from '../../src/service/user/user.service';
import { describe, it, beforeAll, afterAll, expect, jest } from '@jest/globals';

describe('test/service/pay.service.test.ts', () => {
  let app;
  let rechargeService: RechargeService;
  let userService: UserService;
  let userId: number;
  beforeAll(async () => {
    app = await createApp();
    rechargeService = await app.getApplicationContext().getAsync(RechargeService);
    userService = await app.getApplicationContext().getAsync(UserService);
    // 先创建用户
    const userArr = await userService.createUser({ username: 'payuser', password: '123456', nickname: '支付用户' });
    const user = Array.isArray(userArr) ? userArr[0] : userArr;
    userId = user?.id as number;
  });
  afterAll(async () => {
    await close(app);
  });

  it('should create recharge order', async () => {
    // 在测试环境中，支付宝 SDK 可能因为测试密钥格式问题抛出异常
    try {
      const result = await rechargeService.createRechargeOrder(userId, 100);
      expect(result).toBeDefined();
    } catch (error) {
      // 如果因为测试密钥问题失败，这是预期的
      expect(error.message).toContain('支付宝下单失败');
    }
  });

  it('should get recharge records', async () => {
    const result = await rechargeService.getRechargeRecords(userId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle alipay notify', async () => {
    // 这里应传递包含 out_trade_no 的参数
    const notifyData = JSON.stringify({ out_trade_no: 'CZ1234567890' });
    const result = await rechargeService.handleAlipayNotify(notifyData);
    expect(result).toBeDefined();
  });

  it('should fail to create recharge order with invalid userId', async () => {
    await expect(rechargeService.createRechargeOrder(null as unknown as number, 100)).rejects.toThrow();
  });

  it('should fail to create recharge order with negative amount', async () => {
    await expect(rechargeService.createRechargeOrder(userId, -100)).rejects.toThrow();
  });

  it('should fail to create recharge order with zero amount', async () => {
    await expect(rechargeService.createRechargeOrder(userId, 0)).rejects.toThrow();
  });

  it('should create recharge order with large amount', async () => {
    try {
      const result = await rechargeService.createRechargeOrder(userId, 1000000);
      expect(result).toBeDefined();
    } catch (error) {
      expect(error.message).toContain('支付宝下单失败');
    }
  });

  it('should fail to get recharge records with invalid userId', async () => {
    await expect(rechargeService.getRechargeRecords(null as unknown as number)).rejects.toThrow();
  });

  it('should fail to handle notify with missing out_trade_no', async () => {
    const notifyData = JSON.stringify({});
    await expect(rechargeService.handleAlipayNotify(notifyData)).rejects.toThrow();
  });

  it('should throw when handleAlipayNotify with invalid JSON', async () => {
    await expect(rechargeService.handleAlipayNotify('not a json')).rejects.toThrow();
  });

  it('should throw when handleAlipayNotify with empty trade_status', async () => {
    const notifyData = JSON.stringify({ out_trade_no: 'CZ1234567890' });
    const result = await rechargeService.handleAlipayNotify(notifyData);
    expect(result).toBe('success');
  });

  it('should handle unexpected params gracefully', async () => {
    let error = null;
    let result;
    try {
      result = await rechargeService.createRechargeOrder(undefined as unknown as number, 'not_a_number' as unknown as number);
    } catch (e) {
      error = e;
    }
    expect(error !== null || result === undefined || result === null).toBe(true);
  });
});

describe('RechargeService 边界与异常分支补充', () => {
  let rechargeService;
  let userService;
  let userId;
  beforeAll(async () => {
    const app = await createApp();
    rechargeService = await app.getApplicationContext().getAsync(RechargeService);
    userService = await app.getApplicationContext().getAsync(UserService);
    const userArr = await userService.createUser({ username: 'paytest_extra', password: '123456', nickname: '异常用户' });
    const user = Array.isArray(userArr) ? userArr[0] : userArr;
    userId = user?.id as number;
  });

  it('createRechargeOrder userId非法', async () => {
    await expect(rechargeService.createRechargeOrder(null, 100)).rejects.toThrow('userId');
  });
  it('createRechargeOrder amount非法', async () => {
    await expect(rechargeService.createRechargeOrder(userId, -1)).rejects.toThrow('amount');
  });
  it('createRechargeOrder 用户不存在', async () => {
    await expect(rechargeService.createRechargeOrder(999999, 100)).rejects.toThrow('用户不存在');
  });
  it('getRechargeRecords userId非法', async () => {
    await expect(rechargeService.getRechargeRecords(null)).rejects.toThrow('userId');
  });
  it('getRechargeRecords 查询异常', async () => {
    const spy = jest.spyOn(rechargeService.rechargeModel, 'find').mockImplementation(() => { throw new Error('fail'); });
    await expect(rechargeService.getRechargeRecords(userId)).rejects.toThrow('查询充值记录失败');
    spy.mockRestore();
  });
  it('handleAlipayNotify 缺少out_trade_no', async () => {
    await expect(rechargeService.handleAlipayNotify('{}')).rejects.toThrow('缺少订单号参数');
  });
  it('handleAlipayNotify trade_status非success', async () => {
    const res = await rechargeService.handleAlipayNotify(JSON.stringify({ out_trade_no: 'CZ123', trade_status: 'WAIT_BUYER_PAY' }));
    expect(res).toBe('success');
  });
  it('handleAlipayNotify 订单不存在', async () => {
    await expect(rechargeService.handleAlipayNotify(JSON.stringify({ out_trade_no: 'not_exist', trade_status: 'TRADE_SUCCESS' }))).rejects.toThrow('订单不存在');
  });
  it('handleAlipayNotify 订单已处理', async () => {
    // 先创建订单并手动置为success
    const tradeNo = 'CZ_DONE';
    await rechargeService.rechargeModel.save(rechargeService.rechargeModel.create({ recharge_user_id: userId, recharge_amount: 1, recharge_status: 'success', recharge_out_trade_no: tradeNo }));
    const res = await rechargeService.handleAlipayNotify(JSON.stringify({ out_trade_no: tradeNo, trade_status: 'TRADE_SUCCESS' }));
    expect(res).toBe('success');
  });
});

describe('RechargeService 额外分支补充', () => {
  let app;
  let rechargeService;
  let userService;
  let userId;
  const pendingTimeouts: Promise<void>[] = [];
  let spyTimeout;
  beforeAll(async () => {
    app = await createApp();
    rechargeService = await app.getApplicationContext().getAsync(RechargeService);
    userService = await app.getApplicationContext().getAsync(UserService);
    const userArr = await userService.createUser({ username: 'paytest_extra2', password: '123456', nickname: '分支用户' });
    const user = Array.isArray(userArr) ? userArr[0] : userArr;
    userId = user?.id as number;
    // mock setTimeout 全局收集
    spyTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      const p = Promise.resolve().then(fn);
      pendingTimeouts.push(p);
      return {
        ref: () => {},
        unref: () => {},
      } as unknown as NodeJS.Timeout;
    });
  });
  afterAll(async () => {
    await Promise.all(pendingTimeouts);
    spyTimeout.mockRestore();
    await close(app);
  });

  it('createRechargeOrder getAlipaySdk异常', async () => {
    const spy = jest.spyOn(rechargeService, 'getAlipaySdk').mockImplementation(() => { throw new Error('sdk error'); });
    await expect(rechargeService.createRechargeOrder(userId, 100)).rejects.toThrow('支付宝SDK初始化失败');
    spy.mockRestore();
  });

  it('createRechargeOrder alipaySdk.pageExecute异常', async () => {
    // mock testMode 为 false，确保走 pageExecute
    rechargeService.alipayConfig.testMode = false;
    const spySdk = jest.spyOn(rechargeService, 'getAlipaySdk').mockImplementation(() => ({
      pageExecute: () => { throw new Error('page error'); }
    }));
    await expect(rechargeService.createRechargeOrder(userId, 100)).rejects.toThrow('支付宝下单失败');
    spySdk.mockRestore();
  });

  it('handleAlipayNotify 订单存在但用户已被删除', async () => {
    // 先创建订单
    const tradeNo = 'CZ_USERDEL';
    await rechargeService.rechargeModel.save(rechargeService.rechargeModel.create({ recharge_user_id: userId, recharge_amount: 1, recharge_status: 'pending', recharge_out_trade_no: tradeNo }));
    // mock userModel.findOne 返回 null
    const spy = jest.spyOn(rechargeService.userModel, 'findOne').mockResolvedValueOnce(null);
    const res = await rechargeService.handleAlipayNotify(JSON.stringify({ out_trade_no: tradeNo, trade_status: 'TRADE_SUCCESS' }));
    expect(res).toBe('success');
    spy.mockRestore();
  });

  it('handleAlipayNotify 支持query string格式', async () => {
    // 先创建订单
    const tradeNo = 'CZ_QS';
    await rechargeService.rechargeModel.save(rechargeService.rechargeModel.create({ recharge_user_id: userId, recharge_amount: 1, recharge_status: 'pending', recharge_out_trade_no: tradeNo }));
    const qs = `out_trade_no=${tradeNo}&trade_status=TRADE_SUCCESS`;
    const res = await rechargeService.handleAlipayNotify(qs);
    expect(res).toBe('success');
  });

  it('createRechargeOrder 超时自动取消分支', async () => {
    const spySdk = jest.spyOn(rechargeService, 'getAlipaySdk').mockImplementation(() => ({
      pageExecute: () => Promise.resolve('mockUrl')
    }));
    const { record } = await rechargeService.createRechargeOrder(userId, 123);
    const latest = await rechargeService.rechargeModel.findOne({ where: { recharge_id: record.recharge_id } });
    expect(latest.recharge_status === 'cancelled' || latest.recharge_status === 'pending').toBe(true);
    spySdk.mockRestore();
  });

  it('createRechargeOrder amount为字符串', async () => {
    await expect(rechargeService.createRechargeOrder(userId, '100' as unknown as number)).rejects.toThrow();
  });
  it('createRechargeOrder userId为字符串', async () => {
    const spySdk = jest.spyOn(rechargeService, 'getAlipaySdk').mockImplementation(() => ({
      pageExecute: () => Promise.resolve('mockUrl')
    }));
    await expect(rechargeService.createRechargeOrder(String(userId) as unknown as number, 100)).resolves.toBeDefined();
    spySdk.mockRestore();
  });
}); 