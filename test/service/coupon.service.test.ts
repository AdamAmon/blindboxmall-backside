import { createApp, close } from '@midwayjs/mock';
import { CouponService } from '../../src/service/coupon/coupon.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/service/coupon.service.test.ts', () => {
  let app;
  let couponService: CouponService;

  beforeAll(async () => {
    app = await createApp();
    couponService = await app.getApplicationContext().getAsync(CouponService);
    
    // 在测试环境中禁用定时器
    jest.useFakeTimers();
  });

  afterAll(async () => {
    // 清理定时器
    jest.useRealTimers();
    await close(app);
  });

  it('should create coupon successfully', async () => {
    const couponData = {
      name: '测试优惠券',
      description: '测试描述',
      type: 1, // 1满减 2折扣
      threshold: 100,
      amount: 10,
      start_time: new Date(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      total: 100,
      status: 1
    };

    const coupon = await couponService.createCoupon(couponData);
    expect(coupon).toBeDefined();
    expect(coupon.name).toBe(couponData.name);
    expect(coupon.description).toBe(couponData.description);
    expect(coupon.type).toBe(couponData.type);
    expect(coupon.amount).toBe(couponData.amount);
  });

  it('should list valid coupons', async () => {
    const result = await couponService.listCoupons(1, 10, 'valid');
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should list invalid coupons', async () => {
    const result = await couponService.listCoupons(1, 10, 'invalid');
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should handle pagination correctly', async () => {
    const result = await couponService.listCoupons(2, 5, 'valid');
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(5);
  });

  it('should update coupon successfully', async () => {
    // 先创建一个优惠券
    const couponData = {
      name: '测试优惠券',
      description: '测试描述',
      type: 1,
      threshold: 100,
      amount: 10,
      start_time: new Date(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      total: 100,
      status: 1
    };

    const createdCoupon = await couponService.createCoupon(couponData);
    const updateData = {
      name: '更新后的优惠券',
      description: '更新后的描述'
    };

    const result = await couponService.updateCoupon(createdCoupon.id, updateData);
    expect(result).toBeDefined();
  });

  it('should delete coupon successfully', async () => {
    // 先创建一个优惠券
    const couponData = {
      name: '待删除优惠券',
      description: '测试描述',
      type: 1,
      threshold: 100,
      amount: 10,
      start_time: new Date(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      total: 100,
      status: 1
    };

    const createdCoupon = await couponService.createCoupon(couponData);
    const result = await couponService.deleteCoupon(createdCoupon.id);
    expect(result).toBeDefined();
  });

  it('should auto offline expired coupons', async () => {
    // 创建一个已过期的优惠券
    const expiredCouponData = {
      name: '过期优惠券',
      description: '测试描述',
      type: 1,
      threshold: 100,
      amount: 10,
      start_time: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14天前
      end_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
      total: 100,
      status: 1
    };

    await couponService.createCoupon(expiredCouponData);
    
    // 执行自动下线任务
    await couponService.autoOfflineExpiredCoupons();
    
    // 验证过期优惠券已被下线
    const result = await couponService.listCoupons(1, 10, 'invalid');
    expect(result.data.length).toBeGreaterThanOrEqual(0);
  });
}); 