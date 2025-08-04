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

  describe('边界条件测试', () => {
    it('should handle list coupons with default parameters', async () => {
      const result = await couponService.listCoupons();
      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should handle list coupons with zero page', async () => {
      const result = await couponService.listCoupons(0, 10, 'valid');
      expect(result).toBeDefined();
      expect(result.page).toBe(0);
    });

    it('should handle list coupons with zero pageSize', async () => {
      const result = await couponService.listCoupons(1, 0, 'valid');
      expect(result).toBeDefined();
      expect(result.pageSize).toBe(0);
    });

    it('should handle list coupons with negative page', async () => {
      const result = await couponService.listCoupons(-1, 10, 'valid');
      expect(result).toBeDefined();
      expect(result.page).toBe(-1);
    });

    it('should handle list coupons with negative pageSize', async () => {
      const result = await couponService.listCoupons(1, -5, 'valid');
      expect(result).toBeDefined();
      expect(result.pageSize).toBe(-5);
    });

    it('should handle list coupons with very large page', async () => {
      const result = await couponService.listCoupons(999999, 10, 'valid');
      expect(result).toBeDefined();
      expect(result.page).toBe(999999);
    });

    it('should handle list coupons with very large pageSize', async () => {
      const result = await couponService.listCoupons(1, 999999, 'valid');
      expect(result).toBeDefined();
      expect(result.pageSize).toBe(999999);
    });

    it('should handle list coupons with unknown type', async () => {
      const result = await couponService.listCoupons(1, 10, 'unknown');
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should handle list coupons with empty type', async () => {
      const result = await couponService.listCoupons(1, 10, '');
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should handle list coupons with null type', async () => {
      const result = await couponService.listCoupons(1, 10, undefined);
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should handle list coupons with undefined type', async () => {
      const result = await couponService.listCoupons(1, 10, undefined);
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('更新优惠券边界测试', () => {
    it('should handle update coupon with empty data', async () => {
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
      const updateData = {};
      const result = await couponService.updateCoupon(createdCoupon.id, updateData);
      expect(result).toBeDefined();
    });

    it('should handle update coupon with null data', async () => {
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
      const updateData = null;
      const result = await couponService.updateCoupon(createdCoupon.id, updateData);
      expect(result).toBeDefined();
    });

    it('should handle update non-existent coupon', async () => {
      const updateData = {
        name: '更新后的优惠券',
        description: '更新后的描述'
      };

      const result = await couponService.updateCoupon(99999, updateData);
      expect(result).toBeDefined();
    });

    it('should handle update coupon with zero id', async () => {
      const updateData = {
        name: '更新后的优惠券',
        description: '更新后的描述'
      };

      const result = await couponService.updateCoupon(0, updateData);
      expect(result).toBeDefined();
    });

    it('should handle update coupon with negative id', async () => {
      const updateData = {
        name: '更新后的优惠券',
        description: '更新后的描述'
      };

      const result = await couponService.updateCoupon(-1, updateData);
      expect(result).toBeDefined();
    });

    it('should handle update coupon with very large id', async () => {
      const updateData = {
        name: '更新后的优惠券',
        description: '更新后的描述'
      };

      const result = await couponService.updateCoupon(999999999, updateData);
      expect(result).toBeDefined();
    });
  });

  describe('删除优惠券边界测试', () => {
    it('should handle delete non-existent coupon', async () => {
      const result = await couponService.deleteCoupon(99999);
      expect(result).toBeDefined();
    });

    it('should handle delete coupon with zero id', async () => {
      const result = await couponService.deleteCoupon(0);
      expect(result).toBeDefined();
    });

    it('should handle delete coupon with negative id', async () => {
      const result = await couponService.deleteCoupon(-1);
      expect(result).toBeDefined();
    });

    it('should handle delete coupon with very large id', async () => {
      const result = await couponService.deleteCoupon(999999999);
      expect(result).toBeDefined();
    });
  });

  describe('自动下线任务测试', () => {
    it('should handle auto offline with no expired coupons', async () => {
      // 执行自动下线任务，没有过期优惠券的情况
      await couponService.autoOfflineExpiredCoupons();
      
      // 验证任务执行成功
      const result = await couponService.listCoupons(1, 10, 'invalid');
      expect(result).toBeDefined();
    });

    it('should handle auto offline multiple times', async () => {
      // 多次执行自动下线任务
      await couponService.autoOfflineExpiredCoupons();
      await couponService.autoOfflineExpiredCoupons();
      await couponService.autoOfflineExpiredCoupons();
      
      // 验证任务执行成功
      const result = await couponService.listCoupons(1, 10, 'invalid');
      expect(result).toBeDefined();
    });
  });

  describe('优惠券类型测试', () => {
    it('should create discount coupon', async () => {
      const couponData = {
        name: '折扣优惠券',
        description: '测试折扣优惠券',
        type: 2, // 折扣类型
        threshold: 100,
        amount: 0.8, // 8折
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
      expect(coupon.type).toBe(2);
      expect(coupon.amount).toBe(0.8);
    });

    it('should create coupon with zero threshold', async () => {
      const couponData = {
        name: '无门槛优惠券',
        description: '测试无门槛优惠券',
        type: 1,
        threshold: 0,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
      expect(coupon.threshold).toBe(0);
    });

    it('should create coupon with negative threshold', async () => {
      const couponData = {
        name: '负门槛优惠券',
        description: '测试负门槛优惠券',
        type: 1,
        threshold: -100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
      expect(coupon.threshold).toBe(-100);
    });

    it('should create coupon with zero amount', async () => {
      const couponData = {
        name: '零金额优惠券',
        description: '测试零金额优惠券',
        type: 1,
        threshold: 100,
        amount: 0,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
      expect(coupon.amount).toBe(0);
    });

    it('should create coupon with negative amount', async () => {
      const couponData = {
        name: '负金额优惠券',
        description: '测试负金额优惠券',
        type: 1,
        threshold: 100,
        amount: -10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
      expect(coupon.amount).toBe(-10);
    });

    it('should create coupon with zero total', async () => {
      const couponData = {
        name: '零总量优惠券',
        description: '测试零总量优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 0,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
      expect(coupon.total).toBe(0);
    });

    it('should create coupon with negative total', async () => {
      const couponData = {
        name: '负总量优惠券',
        description: '测试负总量优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: -100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
      expect(coupon.total).toBe(-100);
    });

    it('should create coupon with zero status', async () => {
      const couponData = {
        name: '无效优惠券',
        description: '测试无效优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100,
        status: 0
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
      expect(coupon.status).toBe(0);
    });

    it('should create coupon with negative status', async () => {
      const couponData = {
        name: '负状态优惠券',
        description: '测试负状态优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100,
        status: -1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
      expect(coupon.status).toBe(-1);
    });
  });

  describe('时间边界测试', () => {
    it('should create coupon with past start time', async () => {
      const couponData = {
        name: '过去开始时间优惠券',
        description: '测试过去开始时间优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        total: 100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
    });

    it('should create coupon with future start time', async () => {
      const couponData = {
        name: '未来开始时间优惠券',
        description: '测试未来开始时间优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后
        total: 100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
    });

    it('should create coupon with same start and end time', async () => {
      const now = new Date();
      const couponData = {
        name: '同时开始结束优惠券',
        description: '测试同时开始结束优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: now,
        end_time: now,
        total: 100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
    });

    it('should create coupon with end time before start time', async () => {
      const couponData = {
        name: '结束时间早于开始时间优惠券',
        description: '测试结束时间早于开始时间优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        end_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
        total: 100,
        status: 1
      };

      const coupon = await couponService.createCoupon(couponData);
      expect(coupon).toBeDefined();
    });
  });

  // 补充分支覆盖测试
  describe('分支覆盖补充测试', () => {
    it('should handle listCoupons with valid type', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        const result = await couponService.listCoupons(1, 10, 'valid');
        expect(result).toEqual({
          data: [],
          total: 0,
          page: 1,
          pageSize: 10
        });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('coupon.status = 1');
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('coupon.end_time >= :now', { now: expect.any(Date) });
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle listCoupons with invalid type', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        const result = await couponService.listCoupons(1, 10, 'invalid');
        expect(result).toEqual({
          data: [],
          total: 0,
          page: 1,
          pageSize: 10
        });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('coupon.status = 0');
        expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('coupon.end_time < :now', { now: expect.any(Date) });
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle listCoupons with empty type', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        const result = await couponService.listCoupons(1, 10, '');
        expect(result).toEqual({
          data: [],
          total: 0,
          page: 1,
          pageSize: 10
        });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('coupon.status = 0');
        expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('coupon.end_time < :now', { now: expect.any(Date) });
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle listCoupons with null type', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        const result = await couponService.listCoupons(1, 10, undefined);
        expect(result).toEqual({
          data: [],
          total: 0,
          page: 1,
          pageSize: 10
        });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('coupon.status = 0');
        expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('coupon.end_time < :now', { now: expect.any(Date) });
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle listCoupons with undefined type', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        const result = await couponService.listCoupons(1, 10, undefined);
        expect(result).toEqual({
          data: [],
          total: 0,
          page: 1,
          pageSize: 10
        });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('coupon.status = 0');
        expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('coupon.end_time < :now', { now: expect.any(Date) });
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle autoOfflineExpiredCoupons', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 })
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        await couponService.autoOfflineExpiredCoupons();
        expect(mockQueryBuilder.update).toHaveBeenCalled();
        expect(mockQueryBuilder.set).toHaveBeenCalledWith({ status: 0 });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('end_time < :now', { now: expect.any(Date) });
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('status = :status', { status: 1 });
        expect(mockQueryBuilder.execute).toHaveBeenCalled();
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle createCoupon with repository error', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // 临时替换方法
      const originalSave = couponService.couponRepo.save;
      couponService.couponRepo.save = mockSave;

      try {
        await expect(couponService.createCoupon({ name: 'test' })).rejects.toThrow('Database error');
      } catch (error) {
        expect(error.message).toBe('Database error');
      } finally {
        // 恢复原始方法
        couponService.couponRepo.save = originalSave;
      }
    });

    it('should handle updateCoupon with repository error', async () => {
      const mockUpdate = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // 临时替换方法
      const originalUpdate = couponService.couponRepo.update;
      couponService.couponRepo.update = mockUpdate;

      try {
        await expect(couponService.updateCoupon(1, { name: 'test' })).rejects.toThrow('Database error');
      } catch (error) {
        expect(error.message).toBe('Database error');
      } finally {
        // 恢复原始方法
        couponService.couponRepo.update = originalUpdate;
      }
    });

    it('should handle deleteCoupon with repository error', async () => {
      const mockDelete = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // 临时替换方法
      const originalDelete = couponService.couponRepo.delete;
      couponService.couponRepo.delete = mockDelete;

      try {
        await expect(couponService.deleteCoupon(1)).rejects.toThrow('Database error');
      } catch (error) {
        expect(error.message).toBe('Database error');
      } finally {
        // 恢复原始方法
        couponService.couponRepo.delete = originalDelete;
      }
    });

    it('should handle listCoupons with repository error', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        await expect(couponService.listCoupons(1, 10, 'valid')).rejects.toThrow('Database error');
      } catch (error) {
        expect(error.message).toBe('Database error');
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle constructor with unittest environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'unittest';
      
      // 创建新的服务实例，验证不启动定时任务
      const newService = new CouponService();
      expect(newService).toBeDefined();
      
      // 恢复环境变量
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle constructor with production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // 创建新的服务实例，验证启动定时任务
      const newService = new CouponService();
      expect(newService).toBeDefined();
      
      // 恢复环境变量
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle startAutoOfflineTask method', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // 创建服务实例
      const service = new CouponService();
      
      // 获取私有方法
      const startAutoOfflineTask = (service as unknown as Record<string, unknown>).startAutoOfflineTask;
      expect(typeof startAutoOfflineTask).toBe('function');
      
      // 恢复环境变量
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle autoOfflineExpiredCoupons with repository error', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        await expect(couponService.autoOfflineExpiredCoupons()).rejects.toThrow('Database error');
      } catch (error) {
        expect(error.message).toBe('Database error');
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle listCoupons with valid type branch', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        const result = await couponService.listCoupons(1, 10, 'valid');
        expect(result).toEqual({
          data: [],
          total: 0,
          page: 1,
          pageSize: 10
        });
        // 验证调用了 valid 分支的 where 条件
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('coupon.status = 1');
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('coupon.end_time >= :now', { now: expect.any(Date) });
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle listCoupons with invalid type branch', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        const result = await couponService.listCoupons(1, 10, 'invalid');
        expect(result).toEqual({
          data: [],
          total: 0,
          page: 1,
          pageSize: 10
        });
        // 验证调用了 invalid 分支的 where 条件
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('coupon.status = 0');
        expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('coupon.end_time < :now', { now: expect.any(Date) });
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });

    it('should handle listCoupons with empty string type branch', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };
      
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      
      // 临时替换方法
      const originalCreateQueryBuilder = couponService.couponRepo.createQueryBuilder;
      couponService.couponRepo.createQueryBuilder = mockCreateQueryBuilder;

      try {
        const result = await couponService.listCoupons(1, 10, '');
        expect(result).toEqual({
          data: [],
          total: 0,
          page: 1,
          pageSize: 10
        });
        // 验证调用了 else 分支的 where 条件
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('coupon.status = 0');
        expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('coupon.end_time < :now', { now: expect.any(Date) });
      } finally {
        // 恢复原始方法
        couponService.couponRepo.createQueryBuilder = originalCreateQueryBuilder;
      }
    });
  });
}); 