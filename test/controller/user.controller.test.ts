import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';

describe('test/controller/user.controller.test.ts', () => {
  let app;
  let token: string;
  let userId: number;
  beforeAll(async () => {
    app = await createApp<Framework>();
    // 注册并登录，获取 token 和 userId
    const regRes = await createHttpRequest(app).post('/api/auth/register').send({ username: 'user1', password: '123456', nickname: '用户1' });
    userId = regRes.body.result.id;
    const loginRes = await createHttpRequest(app).post('/api/auth/login').send({ username: 'user1', password: '123456' });
    token = loginRes.body.result.token;
  });
  afterAll(async () => {
    await close(app);
  });

  it('should get user', async () => {
    const result = await createHttpRequest(app)
      .get(`/api/user/get?id=${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
  });

  it('should fail to get user with missing id', async () => {
    const result = await createHttpRequest(app)
      .get('/api/user/get')
      .set('Authorization', `Bearer ${token}`);
    expect([400, 401]).toContain(result.status);
  });

  it('should update user', async () => {
    const result = await createHttpRequest(app)
      .post('/api/user/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: userId, nickname: '新昵称' });
    expect(result.status).toBe(200);
  });
}); 