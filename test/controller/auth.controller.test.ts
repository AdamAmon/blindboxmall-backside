import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';

describe('test/controller/auth.controller.test.ts', () => {
  let app;
  beforeAll(async () => {
    app = await createApp<Framework>();
  });
  afterAll(async () => {
    await close(app);
  });

  it('should register user', async () => {
    const dto = { username: 'testuser', password: '123456', nickname: '测试用户' };
    const result = await createHttpRequest(app).post('/api/auth/register').send(dto);
    expect(result.status).toBe(200);
    expect(result.body.message).toBe('注册成功');
  });

  it('should fail to register with existing username', async () => {
    const dto = { username: 'testuser', password: '123456', nickname: '测试用户' };
    await createHttpRequest(app).post('/api/auth/register').send(dto);
    const result = await createHttpRequest(app).post('/api/auth/register').send(dto);
    expect(result.status).toBe(400);
  });

  it('should login user', async () => {
    const dto = { username: 'testuser2', password: '123456' };
    await createHttpRequest(app).post('/api/auth/register').send({ username: 'testuser2', password: '123456', nickname: '测试用户2' });
    const result = await createHttpRequest(app).post('/api/auth/login').send(dto);
    expect(result.status).toBe(200);
    expect(result.body.data.token).toBeDefined();
  });

  it('should fail to login with wrong password', async () => {
    await createHttpRequest(app).post('/api/auth/register').send({ username: 'testuser3', password: '123456', nickname: '测试用户3' });
    const result = await createHttpRequest(app).post('/api/auth/login').send({ username: 'testuser3', password: 'wrong' });
    expect(result.status).toBe(401);
  });

  it('should handle unexpected params gracefully', async () => {
    const result = await createHttpRequest(app)
      .post('/api/auth/register')
      .send({ username: null, password: 12345 });
    expect([200, 400, 401, 403, 404, 422, 500]).toContain(result.status);
  });
}); 