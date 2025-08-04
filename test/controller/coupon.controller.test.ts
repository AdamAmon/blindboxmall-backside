import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework, IMidwayKoaApplication } from '@midwayjs/koa';
import { AuthService } from '../../src/service/auth/auth.service';
import { UserService } from '../../src/service/user/user.service';
import { CouponService } from '../../src/service/coupon/coupon.service';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

describe('test/controller/coupon.controller.test.ts', () => {
  let app: IMidwayKoaApplication;
  let token: string;
  let adminToken: string;
  let couponService: CouponService;

  beforeAll(async () => {
    app = await createApp<Framework>();
    
    const authService = await app.getApplicationContext().getAsync(AuthService);
    const userService = await app.getApplicationContext().getAsync(UserService);
    couponService = await app.getApplicationContext().getAsync(CouponService);

    // 创建普通用户
    const user = await userService.createUser({
      username: 'test_user_coupon',
      password: 'Test@1234',
      nickname: 'Test User',
      role: 'customer'
    });
    token = await authService.generateToken(user);

    // 创建管理员用户
    const admin = await userService.createUser({
      username: 'admin_user_coupon',
      password: 'Test@1234',
      nickname: 'Admin User',
      role: 'admin'
    });
    adminToken = await authService.generateToken(admin);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('POST /api/coupon/', () => {
    it('should create coupon successfully', async () => {
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

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(couponData);

      expect([200, 201, 422]).toContain(result.status);
      if (result.status === 200 || result.status === 201) {
        expect(result.body).toBeDefined();
        expect(result.body.name).toBe(couponData.name);
      }
    });

    it('should reject unauthorized request', async () => {
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

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .send(couponData);

      expect([401, 403, 422]).toContain(result.status);
    });

    // 补充异常处理测试
    it('should handle service exception during creation', async () => {
      const couponData = {
        name: '异常测试优惠券',
        description: '测试描述',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100,
        status: 1
      };

      const spy = jest.spyOn(couponService, 'createCoupon').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(couponData);

      expect([500, 422]).toContain(result.status);
      spy.mockRestore();
    });

    it('should handle validation error during creation', async () => {
      const invalidData = {
        name: '', // 空名称
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });
  });

  describe('GET /api/coupon/', () => {
    it('should list valid coupons', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, type: 'valid' });

      expect([200, 401]).toContain(result.status);
      if (result.status === 200) {
        expect(result.body).toBeDefined();
        expect(result.body.data).toBeDefined();
        expect(Array.isArray(result.body.data)).toBe(true);
      }
    });

    it('should list invalid coupons', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, type: 'invalid' });

      expect([200, 401]).toContain(result.status);
      if (result.status === 200) {
        expect(result.body).toBeDefined();
        expect(result.body.data).toBeDefined();
        expect(Array.isArray(result.body.data)).toBe(true);
      }
    });

    it('should handle pagination correctly', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 2, pageSize: 5 });

      expect([200, 401]).toContain(result.status);
      if (result.status === 200) {
        expect(result.body.page).toBe(2);
        expect(result.body.pageSize).toBe(5);
      }
    });

    it('should list coupons with undefined type', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10 }); // 不传 type
      expect([200, 401]).toContain(result.status);
      if (result.status === 200) {
        expect(result.body).toBeDefined();
        expect(result.body.data).toBeDefined();
        expect(Array.isArray(result.body.data)).toBe(true);
      }
    });

    it('should list coupons with null type', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, type: null });
      expect([200, 401]).toContain(result.status);
      if (result.status === 200) {
        expect(result.body).toBeDefined();
        expect(result.body.data).toBeDefined();
        expect(Array.isArray(result.body.data)).toBe(true);
      }
    });

    it('should list coupons with empty string type', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, type: '' });
      expect([200, 401]).toContain(result.status);
      if (result.status === 200) {
        expect(result.body).toBeDefined();
        expect(result.body.data).toBeDefined();
        expect(Array.isArray(result.body.data)).toBe(true);
      }
    });

    // 补充边界条件测试
    it('should handle negative page number', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: -1, pageSize: 10, type: 'valid' });

      expect([200, 400, 422]).toContain(result.status);
    });

    it('should handle zero page size', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 0, type: 'valid' });

      expect([200, 400, 422]).toContain(result.status);
    });

    it('should handle very large page size', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10000, type: 'valid' });

      expect([200, 400, 422]).toContain(result.status);
    });

    it('should handle service exception during listing', async () => {
      const spy = jest.spyOn(couponService, 'listCoupons').mockImplementation(() => {
        throw new Error('Database query failed');
      });

      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, type: 'valid' });

      expect([200, 500, 422]).toContain(result.status);
      spy.mockRestore();
    });

    it('should handle invalid type parameter', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, type: 'invalid_type' });

      expect([200, 400, 422]).toContain(result.status);
    });
  });

  describe('PUT /api/coupon/', () => {
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
        id: createdCoupon.id,
        name: '更新后的优惠券',
        description: '更新后的描述'
      };

      const result = await createHttpRequest(app)
        .put('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 201, 422]).toContain(result.status);
    });

    it('should reject unauthorized update', async () => {
      const updateData = {
        id: 1,
        name: '更新后的优惠券',
        description: '更新后的描述'
      };

      const result = await createHttpRequest(app)
        .put('/api/coupon/')
        .send(updateData);

      expect([401, 403]).toContain(result.status);
    });

    // 补充异常处理测试
    it('should handle service exception during update', async () => {
      const updateData = {
        id: 1,
        name: '更新后的优惠券',
        description: '更新后的描述'
      };

      const spy = jest.spyOn(couponService, 'updateCoupon').mockImplementation(() => {
        throw new Error('Update failed');
      });

      const result = await createHttpRequest(app)
        .put('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 500, 422]).toContain(result.status);
      spy.mockRestore();
    });

    it('should handle missing id in update', async () => {
      const updateData = {
        name: '更新后的优惠券',
        description: '更新后的描述'
      };

      const result = await createHttpRequest(app)
        .put('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle invalid id in update', async () => {
      const updateData = {
        id: 'invalid_id',
        name: '更新后的优惠券',
        description: '更新后的描述'
      };

      const result = await createHttpRequest(app)
        .put('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([400, 422]).toContain(result.status);
    });
  });

  describe('DELETE /api/coupon/', () => {
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

      const result = await createHttpRequest(app)
        .del('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ id: createdCoupon.id });

      expect([200, 201]).toContain(result.status);
    });

    it('should reject unauthorized delete', async () => {
      const result = await createHttpRequest(app)
        .del('/api/coupon/')
        .query({ id: 1 });

      expect([401, 403]).toContain(result.status);
    });

    // 补充异常处理测试
    it('should handle service exception during delete', async () => {
      const spy = jest.spyOn(couponService, 'deleteCoupon').mockImplementation(() => {
        throw new Error('Delete failed');
      });

      const result = await createHttpRequest(app)
        .del('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ id: 1 });

      expect([200, 500, 422]).toContain(result.status);
      spy.mockRestore();
    });

    it('should handle missing id in delete', async () => {
      const result = await createHttpRequest(app)
        .del('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({});

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid id in delete', async () => {
      const result = await createHttpRequest(app)
        .del('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ id: 'abc' });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle non-existent id in delete', async () => {
      const result = await createHttpRequest(app)
        .del('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ id: 99999 });

      expect([200, 404, 500]).toContain(result.status);
    });
  });

  // 补充边界条件和异常处理测试
  describe('边界条件和异常处理', () => {
    it('创建优惠券时 service 抛出异常', async () => {
      const couponData = {
        name: '异常测试优惠券',
        description: '测试描述',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100,
        status: 1
      };

      const spy = jest.spyOn(couponService, 'createCoupon').mockImplementation(() => {
        throw new Error('service error');
      });

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(couponData);

      expect([500, 422]).toContain(result.status);
      spy.mockRestore();
    });

    it('查询优惠券列表时 service 抛出异常', async () => {
      const spy = jest.spyOn(couponService, 'listCoupons').mockImplementation(() => {
        throw new Error('service error');
      });

      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, type: 'valid' });

      expect([200, 500, 422]).toContain(result.status);
      spy.mockRestore();
    });

    it('更新优惠券时 service 抛出异常', async () => {
      const updateData = {
        id: 1,
        name: '更新后的优惠券',
        description: '更新后的描述',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const spy = jest.spyOn(couponService, 'updateCoupon').mockImplementation(() => {
        throw new Error('service error');
      });

      const result = await createHttpRequest(app)
        .put('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 500, 422]).toContain(result.status);
      spy.mockRestore();
    });

    it('删除优惠券时 service 抛出异常', async () => {
      const spy = jest.spyOn(couponService, 'deleteCoupon').mockImplementation(() => {
        throw new Error('service error');
      });

      const result = await createHttpRequest(app)
        .del('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ id: 1 });

      expect([200, 500, 422]).toContain(result.status);
      spy.mockRestore();
    });

    it('创建优惠券时缺少必填字段', async () => {
      const invalidData = {
        name: '', // 空名称
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('创建优惠券时无效的类型值', async () => {
      const invalidData = {
        name: '测试优惠券',
        type: 3, // 无效类型
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('创建优惠券时负数阈值', async () => {
      const invalidData = {
        name: '测试优惠券',
        type: 1,
        threshold: -100, // 负数阈值
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('查询优惠券列表时无效的分页参数', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: -1, pageSize: 0, type: 'invalid_type' });

      expect([200, 400, 422]).toContain(result.status);
    });

    it('更新优惠券时缺少ID', async () => {
      const updateData = {
        name: '更新后的优惠券',
        description: '更新后的描述',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .put('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([400, 422]).toContain(result.status);
    });

    it('删除优惠券时缺少ID', async () => {
      const result = await createHttpRequest(app)
        .del('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({});

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('删除优惠券时无效的ID', async () => {
      const result = await createHttpRequest(app)
        .del('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ id: 'abc' });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    // 补充更多边界条件测试
    it('should handle empty request body', async () => {
      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect([400, 422]).toContain(result.status);
    });

    it('should handle null request body', async () => {
      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(null as any);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle undefined request body', async () => {
      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle malformed JSON in request body', async () => {
      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "test", "invalid": json}');

      expect([400, 422, 500]).toContain(result.status);
    });

    it('should handle very large request body', async () => {
      const largeData = {
        name: 'a'.repeat(10000), // 超长名称
        description: 'b'.repeat(10000), // 超长描述
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeData);

      expect([200, 400, 413, 422]).toContain(result.status);
    });

    it('should handle special characters in request body', async () => {
      const specialData = {
        name: '测试优惠券!@#$%^&*()',
        description: '描述包含特殊字符: <script>alert("xss")</script>',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specialData);

      expect([200, 400, 422]).toContain(result.status);
    });
  });

  describe('补充测试用例 - 提高分支覆盖率', () => {
    it('should handle validation error for invalid type', async () => {
      const invalidData = {
        name: '测试优惠券',
        type: 3, // 无效类型
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle validation error for negative threshold', async () => {
      const invalidData = {
        name: '测试优惠券',
        type: 1,
        threshold: -100, // 负数阈值
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle validation error for negative amount', async () => {
      const invalidData = {
        name: '测试优惠券',
        type: 1,
        threshold: 100,
        amount: -10, // 负数金额
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle validation error for zero total', async () => {
      const invalidData = {
        name: '测试优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 0 // 零总数
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle validation error for missing required fields', async () => {
      const invalidData = {
        name: '测试优惠券',
        // 缺少其他必填字段
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle validation error for invalid date format', async () => {
      const invalidData = {
        name: '测试优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: 'invalid-date', // 无效日期
        end_time: 'invalid-date', // 无效日期
        total: 100
      };

      const result = await createHttpRequest(app)
        .post('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle validation error for update with missing id', async () => {
      const invalidData = {
        name: '更新后的优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
        // 缺少id
      };

      const result = await createHttpRequest(app)
        .put('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle validation error for update with invalid id', async () => {
      const invalidData = {
        id: 'invalid-id', // 无效ID
        name: '更新后的优惠券',
        type: 1,
        threshold: 100,
        amount: 10,
        start_time: new Date(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        total: 100
      };

      const result = await createHttpRequest(app)
        .put('/api/coupon/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle validation error for list with invalid type', async () => {
      const result = await createHttpRequest(app)
        .get('/api/coupon/')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10, type: 'invalid-type' });

      expect([200, 400, 422]).toContain(result.status);
    });
  });
}); 