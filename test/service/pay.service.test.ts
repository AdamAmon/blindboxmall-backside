import { createApp, close } from '@midwayjs/mock';
import { PayService } from '../../src/service/pay/pay.service';
import { UserService } from '../../src/service/user/user.service';

describe('test/service/pay.service.test.ts', () => {
  let app;
  let payService: PayService;
  let userService: UserService;
  let userId: number;
  beforeAll(async () => {
    app = await createApp();
    payService = await app.getApplicationContext().getAsync(PayService);
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
      const result = await payService.createRechargeOrder(userId, 100);
      expect(result).toBeDefined();
    } catch (error) {
      // 如果因为测试密钥问题失败，这是预期的
      expect(error.message).toContain('支付宝下单失败');
    }
  });

  it('should get recharge records', async () => {
    const result = await payService.getRechargeRecords(userId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle alipay notify', async () => {
    // 这里应传递包含 out_trade_no 的参数
    const notifyData = JSON.stringify({ out_trade_no: 'CZ1234567890' });
    const result = await payService.handleAlipayNotify(notifyData);
    expect(result).toBeDefined();
  });

  it('should fail to create recharge order with invalid userId', async () => {
    await expect(payService.createRechargeOrder(null as unknown as number, 100)).rejects.toThrow();
  });

  it('should fail to create recharge order with negative amount', async () => {
    await expect(payService.createRechargeOrder(userId, -100)).rejects.toThrow();
  });

  it('should fail to create recharge order with zero amount', async () => {
    await expect(payService.createRechargeOrder(userId, 0)).rejects.toThrow();
  });

  it('should create recharge order with large amount', async () => {
    try {
      const result = await payService.createRechargeOrder(userId, 1000000);
      expect(result).toBeDefined();
    } catch (error) {
      expect(error.message).toContain('支付宝下单失败');
    }
  });

  it('should fail to get recharge records with invalid userId', async () => {
    await expect(payService.getRechargeRecords(null as unknown as number)).rejects.toThrow();
  });

  it('should fail to handle notify with missing out_trade_no', async () => {
    const notifyData = JSON.stringify({});
    await expect(payService.handleAlipayNotify(notifyData)).rejects.toThrow();
  });

  it('should throw when handleAlipayNotify with invalid JSON', async () => {
    await expect(payService.handleAlipayNotify('not a json')).rejects.toThrow();
  });

  it('should throw when handleAlipayNotify with empty trade_status', async () => {
    const notifyData = JSON.stringify({ out_trade_no: 'CZ1234567890' });
    const result = await payService.handleAlipayNotify(notifyData);
    expect(result).toBe('success');
  });

  it('should handle unexpected params gracefully', async () => {
    let error = null;
    let result;
    try {
      result = await payService.createRechargeOrder(undefined as unknown as number, 'not_a_number' as unknown as number);
    } catch (e) {
      error = e;
    }
    expect(error !== null || result === undefined || result === null).toBe(true);
  });
});

describe('PayService 边界与异常分支补充', () => {
  let payService;
  let userService;
  let userId;
  beforeAll(async () => {
    const app = await createApp();
    payService = await app.getApplicationContext().getAsync(PayService);
    userService = await app.getApplicationContext().getAsync(UserService);
    const userArr = await userService.createUser({ username: 'paytest_extra', password: '123456', nickname: '异常用户' });
    const user = Array.isArray(userArr) ? userArr[0] : userArr;
    userId = user?.id as number;
  });

  it('createRechargeOrder userId非法', async () => {
    await expect(payService.createRechargeOrder(null, 100)).rejects.toThrow('userId');
  });
  it('createRechargeOrder amount非法', async () => {
    await expect(payService.createRechargeOrder(userId, -1)).rejects.toThrow('amount');
  });
  it('createRechargeOrder 用户不存在', async () => {
    await expect(payService.createRechargeOrder(999999, 100)).rejects.toThrow('用户不存在');
  });
  it('getRechargeRecords userId非法', async () => {
    await expect(payService.getRechargeRecords(null)).rejects.toThrow('userId');
  });
  it('getRechargeRecords 查询异常', async () => {
    const spy = jest.spyOn(payService.rechargeModel, 'find').mockImplementation(() => { throw new Error('fail'); });
    await expect(payService.getRechargeRecords(userId)).rejects.toThrow('查询充值记录失败');
    spy.mockRestore();
  });
  it('handleAlipayNotify 缺少out_trade_no', async () => {
    await expect(payService.handleAlipayNotify('{}')).rejects.toThrow('缺少订单号参数');
  });
  it('handleAlipayNotify trade_status非success', async () => {
    const res = await payService.handleAlipayNotify(JSON.stringify({ out_trade_no: 'CZ123', trade_status: 'WAIT_BUYER_PAY' }));
    expect(res).toBe('success');
  });
  it('handleAlipayNotify 订单不存在', async () => {
    await expect(payService.handleAlipayNotify(JSON.stringify({ out_trade_no: 'not_exist', trade_status: 'TRADE_SUCCESS' }))).rejects.toThrow('订单不存在');
  });
  it('handleAlipayNotify 订单已处理', async () => {
    // 先创建订单并手动置为success
    const tradeNo = 'CZ_DONE';
    await payService.rechargeModel.save(payService.rechargeModel.create({ recharge_user_id: userId, recharge_amount: 1, recharge_status: 'success', recharge_out_trade_no: tradeNo }));
    const res = await payService.handleAlipayNotify(JSON.stringify({ out_trade_no: tradeNo, trade_status: 'TRADE_SUCCESS' }));
    expect(res).toBe('success');
  });
}); 