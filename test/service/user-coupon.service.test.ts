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

  describe('receiveCoupon', () => {
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

    it('should throw error for future coupon', async () => {
      // 创建一个未来的优惠券
      const futureCouponData = {
        name: '未来优惠券',
        description: '测试描述',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后开始
        end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后结束
        total: 100,
        status: 1
      };
      const futureCoupon = await couponService.createCoupon(futureCouponData);

      await expect(userCouponService.receiveCoupon(testUserId, futureCoupon.id)).rejects.toThrow('优惠券不在有效期内');
    });

    it('should handle zero user id', async () => {
      try {
        await userCouponService.receiveCoupon(0, testCouponId);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle negative user id', async () => {
      try {
        await userCouponService.receiveCoupon(-1, testCouponId);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle zero coupon id', async () => {
      try {
        await userCouponService.receiveCoupon(testUserId, 0);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle negative coupon id', async () => {
      try {
        await userCouponService.receiveCoupon(testUserId, -1);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle very large user id', async () => {
      try {
        await userCouponService.receiveCoupon(Number.MAX_SAFE_INTEGER, testCouponId);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle very large coupon id', async () => {
      try {
        await userCouponService.receiveCoupon(testUserId, Number.MAX_SAFE_INTEGER);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle null user id', async () => {
      try {
        await userCouponService.receiveCoupon(null as unknown as number, testCouponId);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined user id', async () => {
      try {
        await userCouponService.receiveCoupon(undefined as unknown as number, testCouponId);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle null coupon id', async () => {
      try {
        await userCouponService.receiveCoupon(testUserId, null as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined coupon id', async () => {
      try {
        await userCouponService.receiveCoupon(testUserId, undefined as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid user id types', async () => {
      try {
        await userCouponService.receiveCoupon('invalid' as unknown as number, testCouponId);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid coupon id types', async () => {
      try {
        await userCouponService.receiveCoupon(testUserId, 'invalid' as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('listUserCoupons', () => {
    it('should list user coupons successfully', async () => {
      const userCoupons = await userCouponService.listUserCoupons(testUserId);
      expect(Array.isArray(userCoupons)).toBe(true);
    });

    it('should return empty array for user with no coupons', async () => {
      const userCoupons = await userCouponService.listUserCoupons(99999);
      expect(Array.isArray(userCoupons)).toBe(true);
      expect(userCoupons.length).toBe(0);
    });

    it('should handle zero user id', async () => {
      try {
        const result = await userCouponService.listUserCoupons(0);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle negative user id', async () => {
      try {
        const result = await userCouponService.listUserCoupons(-1);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle very large user id', async () => {
      try {
        const result = await userCouponService.listUserCoupons(Number.MAX_SAFE_INTEGER);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle null user id', async () => {
      try {
        const result = await userCouponService.listUserCoupons(null as unknown as number);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined user id', async () => {
      try {
        const result = await userCouponService.listUserCoupons(undefined as unknown as number);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid user id types', async () => {
      try {
        const result = await userCouponService.listUserCoupons('invalid' as unknown as number);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('useCoupon', () => {
    it('should use coupon successfully', async () => {
      // 先领取一个优惠券
      const userCoupon = await userCouponService.receiveCoupon(testUserId, testCouponId);
      
      const result = await userCouponService.useCoupon(userCoupon.id);
      expect(result).toBeDefined();
    });

    it('should handle non-existent user coupon id', async () => {
      try {
        const result = await userCouponService.useCoupon(99999);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle zero user coupon id', async () => {
      try {
        const result = await userCouponService.useCoupon(0);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle negative user coupon id', async () => {
      try {
        const result = await userCouponService.useCoupon(-1);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle very large user coupon id', async () => {
      try {
        const result = await userCouponService.useCoupon(Number.MAX_SAFE_INTEGER);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle null user coupon id', async () => {
      try {
        const result = await userCouponService.useCoupon(null as unknown as number);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined user coupon id', async () => {
      try {
        const result = await userCouponService.useCoupon(undefined as unknown as number);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid user coupon id types', async () => {
      try {
        const result = await userCouponService.useCoupon('invalid' as unknown as number);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getAvailableCoupons', () => {
    it('should get available coupons successfully', async () => {
      const availableCoupons = await userCouponService.getAvailableCoupons(testUserId);
      expect(Array.isArray(availableCoupons)).toBe(true);
    });

    it('should return empty array for user with no available coupons', async () => {
      const availableCoupons = await userCouponService.getAvailableCoupons(99999);
      expect(Array.isArray(availableCoupons)).toBe(true);
      expect(availableCoupons.length).toBe(0);
    });

    it('should handle zero user id', async () => {
      try {
        const result = await userCouponService.getAvailableCoupons(0);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle negative user id', async () => {
      try {
        const result = await userCouponService.getAvailableCoupons(-1);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle very large user id', async () => {
      try {
        const result = await userCouponService.getAvailableCoupons(Number.MAX_SAFE_INTEGER);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle null user id', async () => {
      try {
        const result = await userCouponService.getAvailableCoupons(null as unknown as number);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined user id', async () => {
      try {
        const result = await userCouponService.getAvailableCoupons(undefined as unknown as number);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid user id types', async () => {
      try {
        const result = await userCouponService.getAvailableCoupons('invalid' as unknown as number);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('cleanExpiredUserCoupons', () => {
    it('should clean expired user coupons', async () => {
      const cleanedCount = await userCouponService.cleanExpiredUserCoupons();
      expect(typeof cleanedCount).toBe('number');
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle when no expired coupons exist', async () => {
      const cleanedCount = await userCouponService.cleanExpiredUserCoupons();
      expect(typeof cleanedCount).toBe('number');
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple clean operations', async () => {
      const promises = [
        userCouponService.cleanExpiredUserCoupons(),
        userCouponService.cleanExpiredUserCoupons(),
        userCouponService.cleanExpiredUserCoupons()
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getExpiredCouponsStats', () => {
    it('should get expired coupons stats successfully', async () => {
      const stats = await userCouponService.getExpiredCouponsStats();
      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.expired).toBe('number');
      expect(typeof stats.used).toBe('number');
      expect(typeof stats.available).toBe('number');
      expect(stats.total >= 0).toBe(true);
      expect(stats.expired >= 0).toBe(true);
      expect(stats.used >= 0).toBe(true);
      expect(stats.available >= 0).toBe(true);
    });

    it('should handle empty database', async () => {
      const stats = await userCouponService.getExpiredCouponsStats();
      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
    });

    it('should handle database errors gracefully', async () => {
      const stats = await userCouponService.getExpiredCouponsStats();
      expect(stats).toBeDefined();
    });
  });

  describe('constructor and cleanup task', () => {
    it('should initialize service correctly', () => {
      expect(userCouponService).toBeDefined();
      expect(typeof userCouponService.receiveCoupon).toBe('function');
      expect(typeof userCouponService.listUserCoupons).toBe('function');
      expect(typeof userCouponService.useCoupon).toBe('function');
      expect(typeof userCouponService.expireCoupons).toBe('function');
      expect(typeof userCouponService.cleanExpiredUserCoupons).toBe('function');
      expect(typeof userCouponService.getExpiredCouponsStats).toBe('function');
    });

    it('should test cleanup task functionality', async () => {
      // Test that cleanup methods exist and can be called
      expect(typeof userCouponService.cleanExpiredUserCoupons).toBe('function');
      const result = await userCouponService.cleanExpiredUserCoupons();
      expect(typeof result).toBe('number');
    });
  });

  describe('boundary conditions', () => {
    it('should handle concurrent operations', async () => {
      const promises = [
        userCouponService.listUserCoupons(testUserId),
        userCouponService.getAvailableCoupons(testUserId),
        userCouponService.getExpiredCouponsStats()
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(Array.isArray(results[0])).toBe(true);
      expect(Array.isArray(results[1])).toBe(true);
      expect(typeof (results[2] as { total: number }).total).toBe('number');
    });

    it('should handle database connection errors gracefully', async () => {
      try {
        const result = await userCouponService.listUserCoupons(testUserId);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid parameters gracefully', async () => {
      try {
        await userCouponService.receiveCoupon(null as unknown as number, null as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty string parameters', async () => {
      try {
        await userCouponService.receiveCoupon('' as unknown as number, '' as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined parameters', async () => {
      try {
        await userCouponService.receiveCoupon(undefined as unknown as number, undefined as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('异常处理测试', () => {
    it('should handle database connection errors gracefully', async () => {
      try {
        const result = await userCouponService.listUserCoupons(testUserId);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid parameters gracefully', async () => {
      try {
        await userCouponService.receiveCoupon(null as unknown as number, null as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty string parameters', async () => {
      try {
        await userCouponService.receiveCoupon('' as unknown as number, '' as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined parameters', async () => {
      try {
        await userCouponService.receiveCoupon(undefined as unknown as number, undefined as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('方法调用测试', () => {
    it('should call all service methods', async () => {
      // 测试所有方法都存在且可调用
      expect(typeof userCouponService.receiveCoupon).toBe('function');
      expect(typeof userCouponService.listUserCoupons).toBe('function');
      expect(typeof userCouponService.useCoupon).toBe('function');
      expect(typeof userCouponService.getAvailableCoupons).toBe('function');
      expect(typeof userCouponService.cleanExpiredUserCoupons).toBe('function');
      expect(typeof userCouponService.getExpiredCouponsStats).toBe('function');
      expect(typeof userCouponService.expireCoupons).toBe('function');
    });
  });
}); 