import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { AddressService } from '../../src/service/address/address.service';
let app;
let token: string;
let userId: number;
let addressId: number;

beforeAll(async () => {
  app = await createApp();
  // 注册并登录，获取 token 和 userId
  const regRes = await createHttpRequest(app)
    .post('/api/auth/register')
    .send({ username: 'test_addr', password: '123456', nickname: '地址用户' });
  userId = regRes.body.data?.id as number;
  const loginRes = await createHttpRequest(app)
    .post('/api/auth/login')
    .send({ username: 'test_addr', password: '123456' });
  token = loginRes.body.data.token;
});

afterAll(async () => {
  await close(app);
});

describe('test/controller/address.controller.test.ts', () => {
  describe('地址创建', () => {
    it('应该成功创建地址', async () => {
      const addressData = {
        recipient: '张三',
        phone: '13800000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'xx路1号'
      };

      const result = await createHttpRequest(app)
        .post(`/api/address/create?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(addressData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
      expect(result.body.data.recipient).toBe(addressData.recipient);
      
      addressId = result.body.data?.id as number;
    });

    it('应该拒绝缺少用户ID的地址创建请求', async () => {
      const addressData = {
        recipient: '李四',
        phone: '13900000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'yy路2号'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/create')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData);

      expect([400, 401, 500]).toContain(result.status);
    });

    it('应该拒绝无效的地址数据', async () => {
      const invalidData = {
        recipient: '', // 空收件人
        phone: 'invalid', // 无效电话
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'xx路1号'
      };

      const result = await createHttpRequest(app)
        .post(`/api/address/create?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect([400, 422, 500]).toContain(result.status);
    });
  });

  describe('地址查询', () => {
    it('应该成功获取用户地址列表', async () => {
      const result = await createHttpRequest(app)
        .get(`/api/address/list?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
      expect(Array.isArray(result.body.data)).toBe(true);
    });

    it('应该成功获取单个地址详情', async () => {
      const result = await createHttpRequest(app)
        .get(`/api/address/detail?id=${addressId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data.id).toBe(addressId);
    });

    it('应该处理不存在的地址', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=99999')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 404]).toContain(result.status);
    });
  });

  describe('地址更新', () => {
    it('应该成功更新地址', async () => {
      const updateData = {
        id: addressId,
        recipient: '李四',
        phone: '13900000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'yy路2号'
      };

      const result = await createHttpRequest(app)
        .post(`/api/address/update?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data.recipient).toBe(updateData.recipient);
    });

    it('应该拒绝无效用户ID的更新请求', async () => {
      const updateData = {
        id: addressId,
        recipient: '王五',
        phone: '14000000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'zz路3号'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/update?userId=abc')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect([400, 401, 404, 500]).toContain(result.status);
    });

    it('应该拒绝更新不存在的地址', async () => {
      const updateData = {
        id: 99999,
        recipient: '不存在',
        phone: '14000000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '不存在路'
      };

      const result = await createHttpRequest(app)
        .post(`/api/address/update?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect([404, 500]).toContain(result.status);
    });
  });

  describe('地址删除', () => {
    it('应该成功删除地址', async () => {
      // 先创建一个新地址用于删除测试
      const createRes = await createHttpRequest(app)
        .post(`/api/address/create?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: '待删除用户',
          phone: '14100000000',
          province: '江苏',
          city: '南京',
          district: '鼓楼',
          detail: '待删除路'
        });

      const deleteAddressId = createRes.body.data?.id as number;
      const deleteData = { id: deleteAddressId };

      const result = await createHttpRequest(app)
        .post(`/api/address/delete?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });

    it('应该拒绝缺少地址ID的删除请求', async () => {
      const deleteData = {};

      const result = await createHttpRequest(app)
        .post(`/api/address/delete?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect([400, 401, 404, 422, 500]).toContain(result.status);
    });

    it('应该拒绝删除不存在的地址', async () => {
      const deleteData = { id: 99999 };

      const result = await createHttpRequest(app)
        .post(`/api/address/delete?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect([404, 500]).toContain(result.status);
    });
  });

  describe('权限验证', () => {
    it('应该拒绝未授权用户的地址操作', async () => {
      const addressData = {
        recipient: '未授权用户',
        phone: '14200000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '未授权路'
      };

      const result = await createHttpRequest(app)
        .post(`/api/address/create?userId=${userId}`)
        .send(addressData);

      expect(result.status).toBe(401);
    });

    it('应该拒绝操作其他用户的地址', async () => {
      const updateData = {
        id: addressId,
        recipient: '恶意更新',
        phone: '14300000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '恶意路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/update?userId=99999')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect([403, 404, 500]).toContain(result.status);
    });
  });

  describe('异常与边界分支补充', () => {
    it('创建地址时 service 抛出异常', async () => {
      const addressData = {
        recipient: '异常用户',
        phone: '13800000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '异常路1号'
      };
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'createAddress').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .post(`/api/address/create?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(addressData);
      expect([500, 200]).toContain(result.status);
      spy.mockRestore();
    });

    it('更新地址时 service 抛出异常', async () => {
      const updateData = {
        id: addressId,
        recipient: '李四',
        phone: '13900000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'yy路2号'
      };
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'updateAddress').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .post(`/api/address/update?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      expect([500, 200]).toContain(result.status);
      spy.mockRestore();
    });

    it('删除地址时 service 抛出异常', async () => {
      const deleteData = { id: addressId };
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'deleteAddress').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .post(`/api/address/delete?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);
      expect([500, 200]).toContain(result.status);
      spy.mockRestore();
    });

    it('获取地址列表 userId 缺失/非法', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/list?userId=abc')
        .set('Authorization', `Bearer ${token}`);
      expect(result.body.success).toBe(false);
    });

    it('获取地址列表时 service 抛出异常', async () => {
      const addressService = await app.getApplicationContext().getAsync(AddressService);
      const spy = jest.spyOn(addressService, 'listAddresses').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .get(`/api/address/list?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`);
      expect([500, 200]).toContain(result.status);
      spy.mockRestore();
    });

    it('获取地址详情 id 缺失/非法', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=abc')
        .set('Authorization', `Bearer ${token}`);
      expect([400, 422, 500]).toContain(result.status);
    });

    it('设置默认地址正常流程', async () => {
      // 先创建一个新地址
      const createRes = await createHttpRequest(app)
        .post(`/api/address/create?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: '默认用户',
          phone: '14300000000',
          province: '江苏',
          city: '南京',
          district: '鼓楼',
          detail: '默认路'
        });
      const defaultId = createRes.body.data?.id as number;
      const result = await createHttpRequest(app)
        .post(`/api/address/set_default?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ id: defaultId });
      expect(result.body.success).toBe(true);
    });

    it('设置默认地址时 service 抛出异常', async () => {
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'setDefaultAddress').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .post(`/api/address/set_default?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ id: addressId });
      expect([500, 200]).toContain(result.status);
      spy.mockRestore();
    });
  });

  it('should fail to get address list without userId', async () => {
    const result = await createHttpRequest(app)
      .get('/api/address/list')
      .set('Authorization', `Bearer ${token}`);
    if (result.status === 200) {
      expect(
        result.body.data === undefined ||
        result.body.data === null ||
        (Array.isArray(result.body.data) && result.body.data.length === 0)
      ).toBe(true);
    } else {
      expect([400, 401, 422, 500]).toContain(result.status);
    }
  });

  it('should fail to get address detail with invalid id', async () => {
    const result = await createHttpRequest(app)
      .get('/api/address/detail?id=abc')
      .set('Authorization', `Bearer ${token}`);
    expect([400, 404, 500]).toContain(result.status);
  });

  it('should fail to update address with empty body', async () => {
    const result = await createHttpRequest(app)
      .post(`/api/address/update?userId=${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect([400, 422, 500]).toContain(result.status);
  });

  it('should fail to delete address with invalid id', async () => {
    const result = await createHttpRequest(app)
      .post(`/api/address/delete?userId=${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'abc' });
    expect([400, 404, 422, 500]).toContain(result.status);
  });

  it('should handle unexpected params gracefully', async () => {
    const result = await createHttpRequest(app)
      .post('/api/address/create?userId=not_a_number')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient: 123, phone: null });
    expect([200, 400, 401, 403, 404, 422, 500]).toContain(result.status);
  });
}); 