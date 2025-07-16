import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework, IMidwayKoaApplication } from '@midwayjs/koa';
import { AuthService } from '../../src/service/auth.service';
import { UserService } from '../../src';

describe('test/controller/api.test.ts', () => {
  let app: IMidwayKoaApplication;
  let authService: AuthService;
  let userService: UserService;
  let token: string;
  let userId: number;
  let username: string;
  let password: string;

  // 测试前设置
  beforeAll(async () => {
    // 随机生成测试凭据，避免重复问题
    const randomStr = Math.random().toString(36).substring(2, 8);
    username = `testuser_${randomStr}`;
    password = `TestPass123!${randomStr}`;

    // 创建应用实例
    app = await createApp<Framework>();

    // 获取服务实例
    authService = await app.getApplicationContext().getAsync(AuthService);
    userService = await app.getApplicationContext().getAsync(UserService);

    // 创建测试用户
    const testUser = await userService.createUser({
      username,
      password,
      nickname: `Test User ${randomStr}` // 确保提供必要的 nickname
    });
    userId = testUser.id;

    // 生成测试令牌
    token = await authService.generateToken(testUser);
  });

  // 测试后清理
  afterAll(async () => {
    // 清理测试用户
    if (userId) {
      await userService.userModel.delete({ id: userId });
    }
    await close(app);
  });

  describe('GET /api/get_user', () => {
    it('should get user with valid token and existing user ID', async () => {
      const result = await createHttpRequest(app)
        .get('/api/get_user')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: userId });

      // 调试信息
      console.log('GET /api/get_user response:', JSON.stringify(result.body, null, 2));

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty('data');
      expect(result.body.data.id).toBe(userId);
      expect(result.body.data.username).toBe(username);
      // 确保密码没有被返回
      expect(result.body.data.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const result = await createHttpRequest(app)
        .get('/api/get_user')
        .query({ id: userId });

      expect(result.status).toBe(401);
      expect(result.body.message).toMatch(/未提供认证令牌|认证失败/);
    });

    it('should reject request with invalid token', async () => {
      const result = await createHttpRequest(app)
        .get('/api/get_user')
        .set('Authorization', 'Bearer invalid_token')
        .query({ id: userId });

      expect(result.status).toBe(401);
      expect(result.body.message).toMatch(/无效的token|认证失败|过期|无效令牌/);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = 999999;
      const result = await createHttpRequest(app)
        .get('/api/get_user')
        .set('Authorization', `Bearer ${token}`)
        .query({ id: nonExistentId });

      expect(result.status).toBe(404);
      expect(result.body.message).toBe('用户不存在');
      expect(result.body.success).toBe(false);
    });

    it('should handle missing uid parameter', async () => {
      const result = await createHttpRequest(app)
        .get('/api/get_user')
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('缺少用户ID参数');
      expect(result.body.success).toBe(false);
    });
  });

});
