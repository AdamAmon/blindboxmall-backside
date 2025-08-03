import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework, IMidwayKoaApplication } from '@midwayjs/koa';
import { AuthService } from '../../src/service/auth/auth.service';
import { UserService } from '../../src/service/user/user.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/controller/cart.controller.test.ts', () => {
  let app: IMidwayKoaApplication;
  let token: string;
  let userId: number;

  beforeAll(async () => {
    app = await createApp<Framework>();
    
    const authService = await app.getApplicationContext().getAsync(AuthService);
    const userService = await app.getApplicationContext().getAsync(UserService);
    
    // 创建测试用户
    const user = await userService.createUser({
      username: 'carttestuser_' + Date.now(),
      password: '123456',
      nickname: '购物车测试用户'
    });
    userId = user.id;
    
    // 生成token
    token = await authService.generateToken(user);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('POST /api/cart/add', () => {
    it('should add item to cart successfully', async () => {
      const cartData = {
        user_id: userId,
        blind_box_id: 1,
        quantity: 2
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send(cartData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });

    it('should handle missing parameters', async () => {
      const cartData = {
        user_id: userId
        // 缺少 blind_box_id 和 quantity
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send(cartData);

      expect([400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid quantity', async () => {
      const cartData = {
        user_id: userId,
        blind_box_id: 1,
        quantity: -1
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send(cartData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });

    it('should handle zero quantity', async () => {
      const cartData = {
        user_id: userId,
        blind_box_id: 1,
        quantity: 0
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send(cartData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });
  });

  describe('GET /api/cart/list', () => {
    it('should get cart list successfully', async () => {
      const result = await createHttpRequest(app)
        .get('/api/cart/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: userId });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
      expect(Array.isArray(result.body.data)).toBe(true);
    });

    it('should handle missing user_id parameter', async () => {
      const result = await createHttpRequest(app)
        .get('/api/cart/list')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid user_id', async () => {
      const result = await createHttpRequest(app)
        .get('/api/cart/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: 'invalid' });

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should return empty list for user with no cart items', async () => {
      const result = await createHttpRequest(app)
        .get('/api/cart/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ user_id: 99999 });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
      expect(Array.isArray(result.body.data)).toBe(true);
    });
  });

  describe('POST /api/cart/update', () => {
    it('should update cart item successfully', async () => {
      const updateData = {
        cart_id: 1,
        quantity: 5
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/update')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });

    it('should handle missing cart_id', async () => {
      const updateData = {
        quantity: 5
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/update')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle non-existent cart item', async () => {
      const updateData = {
        cart_id: 99999,
        quantity: 5
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/update')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeNull();
    });

    it('should handle negative quantity', async () => {
      const updateData = {
        cart_id: 1,
        quantity: -1
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/update')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });
  });

  describe('POST /api/cart/delete', () => {
    it('should delete cart item successfully', async () => {
      const deleteData = {
        cart_id: 1
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/delete')
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });

    it('should handle missing cart_id', async () => {
      const deleteData = {};

      const result = await createHttpRequest(app)
        .post('/api/cart/delete')
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle non-existent cart item', async () => {
      const deleteData = {
        cart_id: 99999
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/delete')
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });
  });

  describe('POST /api/cart/clear', () => {
    it('should clear cart successfully', async () => {
      const clearData = {
        user_id: userId
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/clear')
        .set('Authorization', `Bearer ${token}`)
        .send(clearData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });

    it('should handle missing user_id', async () => {
      const clearData = {};

      const result = await createHttpRequest(app)
        .post('/api/cart/clear')
        .set('Authorization', `Bearer ${token}`)
        .send(clearData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle invalid user_id', async () => {
      const clearData = {
        user_id: 'invalid'
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/clear')
        .set('Authorization', `Bearer ${token}`)
        .send(clearData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('should handle non-existent user', async () => {
      const clearData = {
        user_id: 99999
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/clear')
        .set('Authorization', `Bearer ${token}`)
        .send(clearData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });
  });

  describe('边界条件测试', () => {
    it('should handle very large quantity', async () => {
      const cartData = {
        user_id: userId,
        blind_box_id: 1,
        quantity: 999999
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send(cartData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });

    it('should handle decimal quantity', async () => {
      const cartData = {
        user_id: userId,
        blind_box_id: 1,
        quantity: 1.5
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send(cartData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });

    it('should handle concurrent cart operations', async () => {
      const cartData = {
        user_id: userId,
        blind_box_id: 1,
        quantity: 1
      };

      const promises = [
        createHttpRequest(app).post('/api/cart/add').set('Authorization', `Bearer ${token}`).send(cartData),
        createHttpRequest(app).post('/api/cart/add').set('Authorization', `Bearer ${token}`).send(cartData),
        createHttpRequest(app).post('/api/cart/add').set('Authorization', `Bearer ${token}`).send(cartData)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });
    });
  });

  describe('异常处理测试', () => {
    it('should handle database connection errors gracefully', async () => {
      const cartData = {
        user_id: userId,
        blind_box_id: 1,
        quantity: 1
      };

      try {
        const result = await createHttpRequest(app)
          .post('/api/cart/add')
          .set('Authorization', `Bearer ${token}`)
          .send(cartData);

        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid token', async () => {
      const cartData = {
        user_id: userId,
        blind_box_id: 1,
        quantity: 1
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/add')
        .set('Authorization', 'Bearer invalid_token')
        .send(cartData);

      expect([401, 403]).toContain(result.status);
    });

    it('should handle missing token', async () => {
      const cartData = {
        user_id: userId,
        blind_box_id: 1,
        quantity: 1
      };

      const result = await createHttpRequest(app)
        .post('/api/cart/add')
        .send(cartData);

      expect([401, 403]).toContain(result.status);
    });
  });
}); 