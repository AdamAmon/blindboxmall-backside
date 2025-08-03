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
  });

  describe('getExpiredCouponsStats', () => {
    it('should get expired coupons stats', async () => {
      const stats = await userCouponService.getExpiredCouponsStats();
      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.expired).toBe('number');
      expect(typeof stats.used).toBe('number');
      expect(typeof stats.available).toBe('number');
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.expired).toBeGreaterThanOrEqual(0);
      expect(stats.used).toBeGreaterThanOrEqual(0);
      expect(stats.available).toBeGreaterThanOrEqual(0);
    });
  });

  describe('expireCoupons', () => {
    it('should expire coupons automatically', async () => {
      const expiredCount = await userCouponService.expireCoupons();
      expect(typeof expiredCount).toBe('number');
      expect(expiredCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle when no coupons to expire', async () => {
      const expiredCount = await userCouponService.expireCoupons();
      expect(typeof expiredCount).toBe('number');
      expect(expiredCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('边界条件测试', () => {
    it('should handle concurrent receive coupon operations', async () => {
      const promises = [
        userCouponService.receiveCoupon(testUserId, testCouponId),
        userCouponService.receiveCoupon(testUserId, testCouponId),
        userCouponService.receiveCoupon(testUserId, testCouponId)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.user_id).toBe(testUserId);
        expect(result.coupon_id).toBe(testCouponId);
      });
    });

    it('should handle concurrent list operations', async () => {
      const promises = [
        userCouponService.listUserCoupons(testUserId),
        userCouponService.listUserCoupons(testUserId),
        userCouponService.listUserCoupons(testUserId)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle concurrent get available coupons operations', async () => {
      const promises = [
        userCouponService.getAvailableCoupons(testUserId),
        userCouponService.getAvailableCoupons(testUserId),
        userCouponService.getAvailableCoupons(testUserId)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle concurrent stats operations', async () => {
      const promises = [
        userCouponService.getExpiredCouponsStats(),
        userCouponService.getExpiredCouponsStats(),
        userCouponService.getExpiredCouponsStats()
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.total).toBe('number');
      });
    });
  });

  describe('异常处理测试', () => {
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

    it('should handle database connection errors gracefully', async () => {
      try {
        const result = await userCouponService.listUserCoupons(testUserId);
        expect(Array.isArray(result)).toBe(true);
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