import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';

describe('test/controller/address.controller.test.ts', () => {
  let app;
  let token: string;
  let userId: number;
  beforeAll(async () => {
    app = await createApp<Framework>();
    // 注册并登录，获取 token 和 userId
    const regRes = await createHttpRequest(app).post('/api/auth/register').send({ username: 'test_addr', password: '123456', nickname: '地址用户' });
    userId = regRes.body.result.id;
    const loginRes = await createHttpRequest(app).post('/api/auth/login').send({ username: 'test_addr', password: '123456' });
    token = loginRes.body.result.token;
  });
  afterAll(async () => {
    await close(app);
  });

  it('should create address', async () => {
    const dto = { recipient: '张三', phone: '13800000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'xx路1号' };
    const result = await createHttpRequest(app)
      .post(`/api/address/create?userId=${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dto);
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
  });

  it('should fail to create address without userId', async () => {
    const dto = { recipient: '张三', phone: '13800000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'xx路1号' };
    const result = await createHttpRequest(app)
      .post('/api/address/create')
      .set('Authorization', `Bearer ${token}`)
      .send(dto);
    expect([400, 401, 500]).toContain(result.status);
  });

  it('should update address', async () => {
    // 先创建一个地址
    const createRes = await createHttpRequest(app)
      .post(`/api/address/create?userId=${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient: '张三', phone: '13800000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'xx路1号' });
    const addressId = createRes.body.data.id;
    const dto = { id: addressId, recipient: '李四', phone: '13900000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'yy路2号' };
    const result = await createHttpRequest(app)
      .post(`/api/address/update?userId=${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dto);
    expect(result.status).toBe(200);
  });

  it('should fail to update address with invalid userId', async () => {
    const dto = { id: 9999, recipient: '李四', phone: '13900000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'yy路2号' };
    const result = await createHttpRequest(app)
      .post('/api/address/update?userId=abc')
      .set('Authorization', `Bearer ${token}`)
      .send(dto);
    expect([400, 401, 404, 500]).toContain(result.status);
  });

  it('should delete address', async () => {
    // 先创建一个地址
    const createRes = await createHttpRequest(app)
      .post(`/api/address/create?userId=${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient: '张三', phone: '13800000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'xx路1号' });
    const addressId = createRes.body.data.id;
    const dto = { id: addressId };
    const result = await createHttpRequest(app)
      .post(`/api/address/delete?userId=${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dto);
    expect(result.status).toBe(200);
  });

  it('should fail to delete address with missing id', async () => {
    const dto = {};
    const result = await createHttpRequest(app)
      .post(`/api/address/delete?userId=${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dto);
    expect([400, 401, 404, 422, 500]).toContain(result.status);
  });
}); 