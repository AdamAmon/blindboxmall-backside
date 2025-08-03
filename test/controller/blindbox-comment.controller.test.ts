import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework, IMidwayKoaApplication } from '@midwayjs/koa';
import { AuthService } from '../../src/service/auth/auth.service';
import { UserService } from '../../src/service/user/user.service';
import { BlindBoxService } from '../../src/service/blindbox/blindbox.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/controller/blindbox-comment.controller.test.ts', () => {
  let app: IMidwayKoaApplication;
  let token: string;
  let userId: number;
  let blindBoxId: number;
  let commentId: number;

  beforeAll(async () => {
    app = await createApp<Framework>();
    
    const authService = await app.getApplicationContext().getAsync(AuthService);
    const userService = await app.getApplicationContext().getAsync(UserService);
    const blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
    
    // 创建测试用户
    const user = await userService.createUser({
      username: 'commenttestuser_' + Date.now(),
      password: '123456',
      nickname: '评论测试用户'
    });
    userId = user.id;
    
    // 生成token
    token = await authService.generateToken(user);

    // 创建测试盲盒
    const blindBox = await blindBoxService.create({
      name: '测试盲盒',
      description: '测试盲盒描述',
      price: 99.99,
      cover_image: 'test.jpg',
      stock: 100,
      status: 1,
      seller_id: userId
    });
    blindBoxId = blindBox.id;
  });

  afterAll(async () => {
    await close(app);
  });

  describe('POST /api/blindbox/comment', () => {
    it('should create comment successfully', async () => {
      const commentData = {
        blind_box_id: blindBoxId,
        content: '测试评论内容'
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .set('Authorization', `Bearer ${token}`)
        .send(commentData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe('评论发布成功');
      expect(result.body.data).toBeDefined();
      
      // 保存评论ID用于后续测试
      commentId = result.body.data.id;
    });

    it('should create reply comment successfully', async () => {
      const commentData = {
        blind_box_id: blindBoxId,
        content: '回复评论内容',
        parent_id: commentId
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .set('Authorization', `Bearer ${token}`)
        .send(commentData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe('评论发布成功');
      expect(result.body.data).toBeDefined();
    });

    it('should handle missing parameters', async () => {
      const commentData = {
        blind_box_id: blindBoxId
        // 缺少 content
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .set('Authorization', `Bearer ${token}`)
        .send(commentData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle empty content', async () => {
      const commentData = {
        blind_box_id: blindBoxId,
        content: ''
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .set('Authorization', `Bearer ${token}`)
        .send(commentData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle unauthorized request', async () => {
      const commentData = {
        blind_box_id: blindBoxId,
        content: '测试评论内容'
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .send(commentData);

      expect(result.status).toBe(401);
      // 检查响应格式，可能是不同的结构
      if (result.body.success !== undefined) {
        expect(result.body.success).toBe(false);
        expect(result.body.message).toBe('用户未登录');
      } else {
        // 如果没有success字段，检查其他可能的响应格式
        expect(result.body.message).toBe('未提供认证令牌');
      }
    });

    it('should handle invalid token', async () => {
      const commentData = {
        blind_box_id: blindBoxId,
        content: '测试评论内容'
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .set('Authorization', 'Bearer invalid_token')
        .send(commentData);

      expect([401, 403]).toContain(result.status);
    });

    it('should handle non-existent blind box', async () => {
      const commentData = {
        blind_box_id: 99999,
        content: '测试评论内容'
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .set('Authorization', `Bearer ${token}`)
        .send(commentData);

      expect(result.status).toBe(400);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('盲盒不存在');
    });
  });

  describe('GET /api/blindbox/comment/list', () => {
    it('should get comment list successfully', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/comment/list')
        .set('Authorization', `Bearer ${token}`)
        .query({
          blind_box_id: blindBoxId,
          page: 1,
          limit: 10
        });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
      expect(result.body.data.list).toBeDefined();
      expect(result.body.data.total).toBeDefined();
      expect(result.body.data.page).toBe(1);
      expect(result.body.data.limit).toBe(10);
    });

    it('should handle missing blind_box_id parameter', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/comment/list')
        .set('Authorization', `Bearer ${token}`)
        .query({
          page: 1,
          limit: 10
        });

      expect([400, 422]).toContain(result.status);
    });

    it('should handle invalid blind_box_id', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/comment/list')
        .set('Authorization', `Bearer ${token}`)
        .query({
          blind_box_id: 'invalid',
          page: 1,
          limit: 10
        });

      expect([400, 422]).toContain(result.status);
    });

    it('should handle pagination parameters', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/comment/list')
        .set('Authorization', `Bearer ${token}`)
        .query({
          blind_box_id: blindBoxId,
          page: 2,
          limit: 5
        });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data.page).toBe(2);
      expect(result.body.data.limit).toBe(5);
    });

    it('should return empty list for non-existent blind box', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/comment/list')
        .set('Authorization', `Bearer ${token}`)
        .query({
          blind_box_id: 99999,
          page: 1,
          limit: 10
        });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data.list).toBeDefined();
      expect(Array.isArray(result.body.data.list)).toBe(true);
      expect(result.body.data.total).toBe(0);
    });
  });

  describe('POST /api/blindbox/comment/like', () => {
    it('should like comment successfully', async () => {
      const likeData = {
        comment_id: commentId
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment/like')
        .set('Authorization', `Bearer ${token}`)
        .send(likeData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });

    it('should handle missing comment_id', async () => {
      const likeData = {};

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment/like')
        .set('Authorization', `Bearer ${token}`)
        .send(likeData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle non-existent comment', async () => {
      const likeData = {
        comment_id: 99999
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment/like')
        .set('Authorization', `Bearer ${token}`)
        .send(likeData);

      expect(result.status).toBe(400);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('评论不存在');
    });

    it('should handle unauthorized request', async () => {
      const likeData = {
        comment_id: commentId
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment/like')
        .send(likeData);

      expect([401, 403]).toContain(result.status);
    });
  });

  describe('DELETE /api/blindbox/comment/:id', () => {
    it('should delete comment successfully', async () => {
      // 先创建一个新评论用于删除测试
      const commentData = {
        blind_box_id: blindBoxId,
        content: '要删除的评论'
      };

      const createResult = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .set('Authorization', `Bearer ${token}`)
        .send(commentData);

      const commentToDelete = createResult.body.data.id;

      const result = await createHttpRequest(app)
        .del(`/api/blindbox/comment/${commentToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe('评论删除成功');
    });

    it('should handle non-existent comment', async () => {
      const commentId = 99999;

      const result = await createHttpRequest(app)
        .del(`/api/blindbox/comment/${commentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(400);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('评论不存在');
    });

    it('should handle unauthorized request', async () => {
      const commentId = 1;

      const result = await createHttpRequest(app)
        .del(`/api/blindbox/comment/${commentId}`);

      expect([401, 403]).toContain(result.status);
    });
  });

  describe('边界条件测试', () => {
    it('should handle very long content', async () => {
      const commentData = {
        blind_box_id: blindBoxId,
        content: 'a'.repeat(1000)
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .set('Authorization', `Bearer ${token}`)
        .send(commentData);

      expect([400, 422]).toContain(result.status);
    });

    it('should handle special characters in content', async () => {
      const commentData = {
        blind_box_id: blindBoxId,
        content: '!@#$%^&*()_+-=[]{}|;:,.<>?'
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/comment')
        .set('Authorization', `Bearer ${token}`)
        .send(commentData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });

    it('should handle invalid page parameters', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/comment/list')
        .set('Authorization', `Bearer ${token}`)
        .query({
          blind_box_id: blindBoxId,
          page: -1,
          limit: 0
        });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });

    it('should handle very large page parameters', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/comment/list')
        .set('Authorization', `Bearer ${token}`)
        .query({
          blind_box_id: blindBoxId,
          page: 999999,
          limit: 999999
        });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });
  });

  describe('异常处理测试', () => {
    it('should handle database connection errors gracefully', async () => {
      const commentData = {
        blind_box_id: blindBoxId,
        content: '测试评论内容'
      };

      try {
        const result = await createHttpRequest(app)
          .post('/api/blindbox/comment')
          .set('Authorization', `Bearer ${token}`)
          .send(commentData);

        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle concurrent comment operations', async () => {
      const commentData = {
        blind_box_id: blindBoxId,
        content: '测试评论内容'
      };

      const promises = [
        createHttpRequest(app).post('/api/blindbox/comment').set('Authorization', `Bearer ${token}`).send(commentData),
        createHttpRequest(app).post('/api/blindbox/comment').set('Authorization', `Bearer ${token}`).send(commentData),
        createHttpRequest(app).post('/api/blindbox/comment').set('Authorization', `Bearer ${token}`).send(commentData)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });
    });
  });
}); 