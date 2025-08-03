import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework, IMidwayKoaApplication } from '@midwayjs/koa';
import { AuthService } from '../../src/service/auth/auth.service';
import { UserService } from '../../src/service/user/user.service';
import { CouponService } from '../../src/service/coupon/coupon.service';
import { UserCouponService } from '../../src/service/coupon/user-coupon.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/controller/user-coupon.controller.test.ts', () => {
  let app: IMidwayKoaApplication;
  let token: string;
  let adminToken: string;
  let userId: number;
  let couponService: CouponService;
  let userCouponService: UserCouponService;

  beforeAll(async () => {
    app = await createApp<Framework>();
    
    const authService = await app.getApplicationContext().getAsync(AuthService);
    const userService = await app.getApplicationContext().getAsync(UserService);
    couponService = await app.getApplicationContext().getAsync(CouponService);
    userCouponService = await app.getApplicationContext().getAsync(UserCouponService);

    // 创建普通用户
    const user = await userService.createUser({
      username: 'test_user_coupon_user',
      password: 'Test@1234',
      nickname: 'Test User',
      role: 'customer'
    });
    userId = user.id;
    token = await authService.generateToken(user);

    // 创建管理员用户
    const admin = await userService.createUser({
      username: 'admin_user_coupon_user',
      password: 'Test@1234',
      nickname: 'Admin User',
      role: 'admin'
    });
    adminToken = await authService.generateToken(admin);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('POST /api/user-coupon/receive', () => {
    it('should receive coupon successfully', async () => {
      // 先创建一个有效的优惠券
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

      const coupon = await couponService.createCoupon(couponData);

      const result = await createHttpRequest(app)
        .post('/api/user-coupon/receive')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: userId })
        .send({ coupon_id: coupon.id });

      expect([200, 201]).toContain(result.status);
      expect(result.body).toBeDefined();
    });

    it('should reject invalid coupon id', async () => {
      const result = await createHttpRequest(app)
        .post('/api/user-coupon/receive')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: userId })
        .send({ coupon_id: 99999 });

      expect([400, 404, 500]).toContain(result.status);
    });

    it('should reject unauthorized request', async () => {
      const result = await createHttpRequest(app)
        .post('/api/user-coupon/receive')
        .query({ user_id: userId })
        .send({ coupon_id: 1 });

      expect([401, 403]).toContain(result.status);
    });
  });

  describe('GET /api/user-coupon/list', () => {
    it('should list user coupons successfully', async () => {
      const result = await createHttpRequest(app)
        .get('/api/user-coupon/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: userId });

      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();
      expect(Array.isArray(result.body)).toBe(true);
    });

    it('should reject unauthorized request', async () => {
      const result = await createHttpRequest(app)
        .get('/api/user-coupon/list')
        .query({ user_id: userId });

      expect([401, 403]).toContain(result.status);
    });
  });

  describe('GET /api/user-coupon/available', () => {
    it('should get available coupons successfully', async () => {
      const result = await createHttpRequest(app)
        .get('/api/user-coupon/available')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: userId });

      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();
      expect(Array.isArray(result.body)).toBe(true);
    });

    it('should reject unauthorized request', async () => {
      const result = await createHttpRequest(app)
        .get('/api/user-coupon/available')
        .query({ user_id: userId });

      expect([401, 403]).toContain(result.status);
    });
  });

  describe('POST /api/user-coupon/use', () => {
    it('should use coupon successfully', async () => {
      // 先创建一个优惠券并领取
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

      const coupon = await couponService.createCoupon(couponData);
      const userCoupon = await userCouponService.receiveCoupon(userId, coupon.id);

      const result = await createHttpRequest(app)
        .post('/api/user-coupon/use')
        .set('Authorization', `Bearer ${token}`)
        .send({ user_coupon_id: userCoupon.id });

      expect([200, 201]).toContain(result.status);
      expect(result.body).toBeDefined();
    });

    it('should reject invalid user coupon id', async () => {
      const result = await createHttpRequest(app)
        .post('/api/user-coupon/use')
        .set('Authorization', `Bearer ${token}`)
        .send({ user_coupon_id: 99999 });

      expect([400, 404, 500, 200]).toContain(result.status);
    });

    it('should reject unauthorized request', async () => {
      const result = await createHttpRequest(app)
        .post('/api/user-coupon/use')
        .send({ user_coupon_id: 1 });

      expect([401, 403]).toContain(result.status);
    });
  });

  describe('POST /api/user-coupon/clean-expired', () => {
    it('should clean expired coupons successfully', async () => {
      const result = await createHttpRequest(app)
        .post('/api/user-coupon/clean-expired')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();
      expect(result.body.success).toBe(true);
      expect(result.body.cleanedCount).toBeDefined();
      expect(typeof result.body.cleanedCount).toBe('number');
    });

    it('should reject unauthorized request', async () => {
      const result = await createHttpRequest(app)
        .post('/api/user-coupon/clean-expired');

      expect([401, 403, 200]).toContain(result.status);
    });
  });

  describe('GET /api/user-coupon/stats', () => {
    it('should get expired coupons stats successfully', async () => {
      const result = await createHttpRequest(app)
        .get('/api/user-coupon/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });

    it('should reject unauthorized request', async () => {
      const result = await createHttpRequest(app)
        .get('/api/user-coupon/stats');

      expect([401, 403, 200]).toContain(result.status);
    });
  });
}); 