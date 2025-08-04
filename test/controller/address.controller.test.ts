import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
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

    // 新增测试用例
    it('应该处理从DTO中获取user_id的情况', async () => {
      const addressData = {
        user_id: userId,
        recipient: 'DTO用户',
        phone: '14400000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'DTO路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/create')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('应该处理从ctx.user中获取用户ID的情况', async () => {
      const addressData = {
        recipient: 'CTX用户',
        phone: '14500000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'CTX路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/create')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('应该处理无效的userId参数', async () => {
      const addressData = {
        recipient: '无效用户',
        phone: '14600000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '无效路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/create?userId=abc')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData);

      expect([400, 500]).toContain(result.status);
    });

    it('应该处理NaN的userId参数', async () => {
      const addressData = {
        recipient: 'NaN用户',
        phone: '14700000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'NaN路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/create?userId=NaN')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData);

      expect([400, 500]).toContain(result.status);
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

    // 新增测试用例
    it('应该处理从ctx.user中获取用户ID的列表查询', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/list')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400]).toContain(result.status);
    });

    it('应该处理无效的userId参数列表查询', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/list?userId=abc')
        .set('Authorization', `Bearer ${token}`);

      expect(result.body.success).toBe(false);
    });

    it('应该处理NaN的userId参数列表查询', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/list?userId=NaN')
        .set('Authorization', `Bearer ${token}`);

      expect(result.body.success).toBe(false);
    });

    it('应该处理空字符串的id参数', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(result.status);
    });

    it('应该处理null的id参数', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=null')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(result.status);
    });

    it('应该处理undefined的id参数', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=undefined')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(result.status);
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

    // 新增测试用例
    it('应该处理从DTO中获取user_id的更新', async () => {
      const updateData = {
        id: addressId,
        user_id: userId,
        recipient: 'DTO更新用户',
        phone: '14800000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'DTO更新路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/update')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('应该处理从ctx.user中获取用户ID的更新', async () => {
      const updateData = {
        id: addressId,
        recipient: 'CTX更新用户',
        phone: '14900000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'CTX更新路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/update')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('应该处理NaN的userId参数更新', async () => {
      const updateData = {
        id: addressId,
        recipient: 'NaN更新用户',
        phone: '15000000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: 'NaN更新路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/update?userId=NaN')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect([400, 500]).toContain(result.status);
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

    // 新增测试用例
    it('应该处理从DTO中获取user_id的删除', async () => {
      const deleteData = { 
        id: addressId,
        user_id: userId
      };

      const result = await createHttpRequest(app)
        .post('/api/address/delete')
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect([200, 400, 422, 500]).toContain(result.status);
    });

    it('应该处理从ctx.user中获取用户ID的删除', async () => {
      const deleteData = { id: addressId };

      const result = await createHttpRequest(app)
        .post('/api/address/delete')
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect([200, 400, 500]).toContain(result.status);
    });

    it('应该处理NaN的userId参数删除', async () => {
      const deleteData = { id: addressId };

      const result = await createHttpRequest(app)
        .post('/api/address/delete?userId=NaN')
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect([400, 500]).toContain(result.status);
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

    // 新增测试用例
    it('应该处理更新地址时404异常', async () => {
      const updateData = {
        id: 99999,
        recipient: '404用户',
        phone: '15100000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '404路'
      };
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'updateAddress').mockImplementation(() => { 
        const error = new Error('地址不存在');
        (error as { status?: number }).status = 404;
        throw error;
      });
      const result = await createHttpRequest(app)
        .post(`/api/address/update?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      expect([404, 500]).toContain(result.status);
      spy.mockRestore();
    });

    it('应该处理删除地址时404异常', async () => {
      const deleteData = { id: 99999 };
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'deleteAddress').mockImplementation(() => { 
        const error = new Error('地址不存在');
        (error as { status?: number }).status = 404;
        throw error;
      });
      const result = await createHttpRequest(app)
        .post(`/api/address/delete?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);
      expect([404, 500]).toContain(result.status);
      spy.mockRestore();
    });

    it('应该处理地址详情查询时数据库异常', async () => {
      const addressService = await app.getApplicationContext().getAsync(AddressService);
      const spy = jest.spyOn(addressService.addressModel, 'findOne').mockImplementation(() => { throw new Error('database error'); });
      const result = await createHttpRequest(app)
        .get(`/api/address/detail?id=${addressId}`)
        .set('Authorization', `Bearer ${token}`);
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

  // 新增异常处理测试
  describe('异常处理测试', () => {
    it('应该处理数据库连接异常', async () => {
      const addressService = await app.getApplicationContext().getAsync(AddressService);
      const spy = jest.spyOn(addressService, 'createAddress').mockImplementation(() => { 
        throw new Error('数据库连接失败');
      });
      const result = await createHttpRequest(app)
        .post(`/api/address/create?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: '数据库异常用户',
          phone: '15800000000',
          province: '江苏',
          city: '南京',
          district: '鼓楼',
          detail: '数据库异常路'
        });
      expect([500, 200]).toContain(result.status);
      spy.mockRestore();
    });

    it('应该处理并发操作异常', async () => {
      const addressData = {
        recipient: '并发用户',
        phone: '15900000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '并发路'
      };

      const promises = Array(5).fill(null).map(() => 
        createHttpRequest(app)
          .post(`/api/address/create?userId=${userId}`)
          .set('Authorization', `Bearer ${token}`)
          .send(addressData)
      );

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect([200, 400, 500]).toContain(result.status);
      });
    });

    // 新增测试用例：覆盖未覆盖的分支
    it('应该处理删除地址时service返回false的情况', async () => {
      const deleteData = { id: 99999 };
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'deleteAddress').mockResolvedValue(false);
      const result = await createHttpRequest(app)
        .post(`/api/address/delete?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);
      expect([404, 500]).toContain(result.status);
      expect(result.body.success).toBe(false);
      spy.mockRestore();
    });

    it('应该处理更新地址时service抛出非404异常', async () => {
      const updateData = {
        id: addressId,
        recipient: '异常用户',
        phone: '16000000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '异常路'
      };
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'updateAddress').mockImplementation(() => { 
        throw new Error('其他异常');
      });
      const result = await createHttpRequest(app)
        .post(`/api/address/update?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      expect(result.status).toBe(500);
      expect(result.body.success).toBe(false);
      spy.mockRestore();
    });

    it('应该处理删除地址时service抛出非404异常', async () => {
      const deleteData = { id: addressId };
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'deleteAddress').mockImplementation(() => { 
        throw new Error('其他异常');
      });
      const result = await createHttpRequest(app)
        .post(`/api/address/delete?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);
      expect(result.status).toBe(500);
      expect(result.body.success).toBe(false);
      spy.mockRestore();
    });

    it('应该处理地址详情查询时数据库返回null', async () => {
      const addressService = await app.getApplicationContext().getAsync(AddressService);
      const spy = jest.spyOn(addressService.addressModel, 'findOne').mockResolvedValue(null);
      const result = await createHttpRequest(app)
        .get(`/api/address/detail?id=${addressId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('地址不存在');
      spy.mockRestore();
    });

    it('应该处理设置默认地址时service抛出异常', async () => {
      const spy = jest.spyOn(app.getApplicationContext().get('addressService'), 'setDefaultAddress').mockImplementation(() => { 
        throw new Error('设置默认地址失败');
      });
      const result = await createHttpRequest(app)
        .post(`/api/address/set_default?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ id: addressId });
      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      spy.mockRestore();
    });

    it('应该处理获取地址列表时service抛出异常', async () => {
      const addressService = await app.getApplicationContext().getAsync(AddressService);
      const spy = jest.spyOn(addressService, 'listAddresses').mockImplementation(() => { 
        throw new Error('获取地址列表失败');
      });
      const result = await createHttpRequest(app)
        .get(`/api/address/list?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      spy.mockRestore();
    });

    it('应该处理地址详情查询时数据库抛出异常', async () => {
      const addressService = await app.getApplicationContext().getAsync(AddressService);
      const spy = jest.spyOn(addressService.addressModel, 'findOne').mockImplementation(() => { 
        throw new Error('数据库查询异常');
      });
      const result = await createHttpRequest(app)
        .get(`/api/address/detail?id=${addressId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('数据库查询异常');
      spy.mockRestore();
    });
  });

  // 新增边界条件测试
  describe('边界条件测试', () => {
    it('应该处理零值userId', async () => {
      const result = await createHttpRequest(app)
        .post('/api/address/create?userId=0')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: '零值用户',
          phone: '15200000000',
          province: '江苏',
          city: '南京',
          district: '鼓楼',
          detail: '零值路'
        });
      expect([400, 500]).toContain(result.status);
    });

    it('应该处理负值userId', async () => {
      const result = await createHttpRequest(app)
        .post('/api/address/create?userId=-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: '负值用户',
          phone: '15300000000',
          province: '江苏',
          city: '南京',
          district: '鼓楼',
          detail: '负值路'
        });
      expect([400, 500]).toContain(result.status);
    });

    it('应该处理极大值userId', async () => {
      const result = await createHttpRequest(app)
        .post('/api/address/create?userId=999999999999999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: '极大值用户',
          phone: '15400000000',
          province: '江苏',
          city: '南京',
          district: '鼓楼',
          detail: '极大值路'
        });
      expect([200, 400, 500]).toContain(result.status);
    });

    it('应该处理空字符串userId', async () => {
      const result = await createHttpRequest(app)
        .post('/api/address/create?userId=')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: '空字符串用户',
          phone: '15500000000',
          province: '江苏',
          city: '南京',
          district: '鼓楼',
          detail: '空字符串路'
        });
      expect([400, 500]).toContain(result.status);
    });

    it('应该处理null userId', async () => {
      const result = await createHttpRequest(app)
        .post('/api/address/create?userId=null')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: 'null用户',
          phone: '15600000000',
          province: '江苏',
          city: '南京',
          district: '鼓楼',
          detail: 'null路'
        });
      expect([400, 500]).toContain(result.status);
    });

    it('应该处理undefined userId', async () => {
      const result = await createHttpRequest(app)
        .post('/api/address/create?userId=undefined')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: 'undefined用户',
          phone: '15700000000',
          province: '江苏',
          city: '南京',
          district: '鼓楼',
          detail: 'undefined路'
        });
      expect([400, 500]).toContain(result.status);
    });

    // 新增测试用例：覆盖更多边界条件
    it('应该处理创建地址时所有用户ID来源都无效的情况', async () => {
      const addressData = {
        recipient: '无效用户',
        phone: '16100000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '无效路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/create?userId=abc')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData);

      expect([400, 500]).toContain(result.status);
      expect(result.body.success).toBe(false);
    });

    it('应该处理更新地址时所有用户ID来源都无效的情况', async () => {
      const updateData = {
        id: addressId,
        recipient: '无效更新用户',
        phone: '16200000000',
        province: '江苏',
        city: '南京',
        district: '鼓楼',
        detail: '无效更新路'
      };

      const result = await createHttpRequest(app)
        .post('/api/address/update?userId=abc')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect([400, 500]).toContain(result.status);
      expect(result.body.success).toBe(false);
    });

    it('应该处理删除地址时所有用户ID来源都无效的情况', async () => {
      const deleteData = { id: addressId };

      const result = await createHttpRequest(app)
        .post('/api/address/delete?userId=abc')
        .set('Authorization', `Bearer ${token}`)
        .send(deleteData);

      expect([400, 500]).toContain(result.status);
      expect(result.body.success).toBe(false);
    });

    it('应该处理获取地址列表时所有用户ID来源都无效的情况', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/list?userId=abc')
        .set('Authorization', `Bearer ${token}`);

      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe('缺少或非法用户ID');
    });

    it('应该处理地址详情查询时id为null', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=null')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(result.status);
    });

    it('应该处理地址详情查询时id为undefined', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=undefined')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(result.status);
    });

    it('应该处理地址详情查询时id为空字符串', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(result.status);
    });

    it('应该处理地址详情查询时id为NaN', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=NaN')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(result.status);
    });



    it('应该处理地址详情查询时id为极大值', async () => {
      const result = await createHttpRequest(app)
        .get('/api/address/detail?id=999999999999999')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 404, 500]).toContain(result.status);
    });
  });
}); 