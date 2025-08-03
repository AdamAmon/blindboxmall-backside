import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework, IMidwayKoaApplication } from '@midwayjs/koa';
import { AuthService } from '../../src/service/auth/auth.service';
import { UserService } from '../../src/service/user/user.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/controller/player-show.controller.test.ts', () => {
  let app: IMidwayKoaApplication;
  let token: string;
  let userId: number;

  beforeAll(async () => {
    app = await createApp<Framework>();
    
    const authService = await app.getApplicationContext().getAsync(AuthService);
    const userService = await app.getApplicationContext().getAsync(UserService);

    // 创建测试用户
    const user = await userService.createUser({
      username: 'test_user_show',
      password: 'Test@1234',
      nickname: 'Test User',
      role: 'customer'
    });
    userId = user.id;
    token = await authService.generateToken(user);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('POST /api/community/show/create', () => {
    it('should handle create show error gracefully', async () => {
      const invalidData = {
        user_id: userId,
        // 缺少必需字段
      };

      const result = await createHttpRequest(app)
        .post('/api/community/show/create')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
    });
  });

  describe('GET /api/community/show/list', () => {
    it('should get show list successfully', async () => {
      const result = await createHttpRequest(app)
        .get('/api/community/show/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, pageSize: 10 });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
      expect(result.body.data.list).toBeDefined();
      expect(result.body.data.total).toBeDefined();
    });

    it('should handle pagination correctly', async () => {
      const result = await createHttpRequest(app)
        .get('/api/community/show/list')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 2, pageSize: 5 });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data.page).toBe(2);
      expect(result.body.data.pageSize).toBe(5);
    });
  });

  describe('GET /api/community/show/detail', () => {
    it('should handle missing id parameter', async () => {
      const result = await createHttpRequest(app)
        .get('/api/community/show/detail')
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('缺少id参数');
    });
  });

  describe('GET /api/community/show/comments', () => {
    it('should handle missing show_id parameter', async () => {
      const result = await createHttpRequest(app)
        .get('/api/community/show/comments')
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('缺少show_id参数');
    });
  });

  describe('POST /api/community/show/like', () => {
    it('should handle missing parameters', async () => {
      const result = await createHttpRequest(app)
        .post('/api/community/show/like')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('缺少参数');
    });
  });

  describe('POST /api/community/show/comment/like', () => {
    it('should handle missing comment_id parameter', async () => {
      const result = await createHttpRequest(app)
        .post('/api/community/show/comment/like')
        .set('Authorization', `Bearer ${token}`)
        .send({ user_id: userId });

      expect(result.status).toBe(400);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('缺少comment_id参数');
    });

    it('should handle unauthorized request', async () => {
      const result = await createHttpRequest(app)
        .post('/api/community/show/comment/like')
        .send({ comment_id: 1, user_id: userId });

      expect(result.status).toBe(401);
      // 检查响应体结构，可能没有success字段
      expect(result.body).toBeDefined();
      expect(['用户未登录', '未提供认证令牌']).toContain(result.body.message);
    });
  });
}); 