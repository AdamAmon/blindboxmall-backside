import { createApp, close } from '@midwayjs/mock';
import { UserCouponService } from '../../src/service/coupon/user-coupon.service';
import { CouponService } from '../../src/service/coupon/coupon.service';
import { UserService } from '../../src/service/user/user.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/service/user-coupon.service.test.ts', () => {
  let app;
  let userCouponService: UserCouponService;
  let couponService: CouponService;
  let userService: UserService;
  let testUserId: number;
  let testCouponId: number;

  beforeAll(async () => {
    app = await createApp();
    userCouponService = await app.getApplicationContext().getAsync(UserCouponService);
    couponService = await app.getApplicationContext().getAsync(CouponService);
    userService = await app.getApplicationContext().getAsync(UserService);

    // 创建测试用户
    const user = await userService.createUser({
      username: 'test_user_coupon_service',
      password: 'Test@1234',
      nickname: 'Test User',
      role: 'customer'
    });
    testUserId = user.id;

    // 创建测试优惠券
    const couponData = {
      name: '测试优惠券',
      description: '测试描述',
      type: 1,
      threshold: 100,
      amount: 10,
      start_time: new Date(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      total: 100,
      status: 1
    };
    const coupon = await couponService.createCoupon(couponData);
    testCouponId = coupon.id;
  });

  afterAll(async () => {
    await close(app);
  });

  it('should receive coupon successfully', async () => {
    const userCoupon = await userCouponService.receiveCoupon(testUserId, testCouponId);
    expect(userCoupon).toBeDefined();
    expect(userCoupon.user_id).toBe(testUserId);
    expect(userCoupon.coupon_id).toBe(testCouponId);
  });

  it('should throw error for non-existent coupon', async () => {
    await expect(userCouponService.receiveCoupon(testUserId, 99999)).rejects.toThrow('优惠券不存在');
  });

  it('should throw error for expired coupon', async () => {
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
    const expiredCoupon = await couponService.createCoupon(expiredCouponData);

    await expect(userCouponService.receiveCoupon(testUserId, expiredCoupon.id)).rejects.toThrow('优惠券不在有效期内');
  });

  it('should list user coupons successfully', async () => {
    const userCoupons = await userCouponService.listUserCoupons(testUserId);
    expect(Array.isArray(userCoupons)).toBe(true);
  });

  it('should use coupon successfully', async () => {
    // 先领取一个优惠券
    const userCoupon = await userCouponService.receiveCoupon(testUserId, testCouponId);
    
    const result = await userCouponService.useCoupon(userCoupon.id);
    expect(result).toBeDefined();
  });

  it('should get available coupons successfully', async () => {
    const availableCoupons = await userCouponService.getAvailableCoupons(testUserId);
    expect(Array.isArray(availableCoupons)).toBe(true);
  });

  it('should clean expired user coupons', async () => {
    const cleanedCount = await userCouponService.cleanExpiredUserCoupons();
    expect(typeof cleanedCount).toBe('number');
    expect(cleanedCount).toBeGreaterThanOrEqual(0);
  });

  it('should get expired coupons stats', async () => {
    const stats = await userCouponService.getExpiredCouponsStats();
    expect(stats).toBeDefined();
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.expired).toBe('number');
    expect(typeof stats.used).toBe('number');
    expect(typeof stats.available).toBe('number');
  });

  it('should expire coupons automatically', async () => {
    const expiredCount = await userCouponService.expireCoupons();
    expect(typeof expiredCount).toBe('number');
    expect(expiredCount).toBeGreaterThanOrEqual(0);
  });
}); 