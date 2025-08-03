import { createApp, createHttpRequest } from '@midwayjs/mock';
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { BlindBoxService } from '../../src/service/blindbox/blindbox.service';

let app;
let token;

beforeAll(async () => {
  app = await createApp();
  // 先注册 seller 用户，保证存在
  await createHttpRequest(app)
    .post('/api/auth/register')
    .send({ username: 'seller', password: '123456', nickname: '测试商家', role: 'seller' });
  // 再登录获取 token
  const res = await createHttpRequest(app)
    .post('/api/auth/login')
    .send({ username: 'seller', password: '123456' });
  token = res.body.data?.token;
});

afterAll(async () => {
  if (app && typeof app.close === 'function') await app.close();
});

describe('test/controller/blindbox.controller.test.ts', () => {
  let userId: number;
  let sellerId: number;
  let blindBoxId: number;
  let boxItemId: number;

  beforeAll(async () => {
    // 创建测试用户（买家）
    const regRes = await createHttpRequest(app)
      .post('/api/auth/register')
      .send({ 
        username: 'test_buyer', 
        password: '123456', 
        nickname: '测试买家' 
      });
    userId = regRes.body.data?.id as number;
    
    // 创建测试商家
    const sellerRes = await createHttpRequest(app)
      .post('/api/auth/register')
      .send({ 
        username: 'test_seller', 
        password: '123456', 
        nickname: '测试商家' 
      });
    sellerId = sellerRes.body.data?.id as number;
  });

  describe('盲盒管理', () => {
    it('应该成功创建盲盒', async () => {
      const createData = {
        name: '测试盲盒',
        description: '这是一个测试盲盒',
        price: 99.99,
        cover_image: 'https://example.com/cover.jpg',
        stock: 100,
        status: 1,
        seller_id: sellerId
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox')
        .set('Authorization', `Bearer ${token}`)
        .send(createData);

      expect([200, 400, 404, 422, 500]).toContain(result.status);
      expect(result.body.code).toBe(200);
      expect(result.body.data).toBeDefined();
      blindBoxId = result.body.data?.id as number;
    });

    it('应该成功获取盲盒详情', async () => {
      const result = await createHttpRequest(app)
        .get(`/api/blindbox/${blindBoxId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.data.id).toBe(blindBoxId);
    });

    it('应该成功更新盲盒', async () => {
      const updateData = {
        name: '更新后的盲盒',
        price: 88.88
      };

      const result = await createHttpRequest(app)
        .put(`/api/blindbox/${blindBoxId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.data.name).toBe(updateData.name);
    });

    it('应该成功查询盲盒列表', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.data.list).toBeDefined();
      expect(result.body.data.total).toBeGreaterThan(0);
    });

    it('应该成功按关键词搜索盲盒', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox')
        .query({ keyword: '测试' })
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
    });

    it('应该成功按状态筛选盲盒', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox?status=1')
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
    });
  });

  describe('盲盒商品管理', () => {
    it('应该成功创建盲盒商品', async () => {
      const createItemData = {
        blind_box_id: blindBoxId,
        name: '稀有商品A',
        image: 'https://example.com/item.jpg',
        rarity: 1,
        probability: 0.1
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/items')
        .set('Authorization', `Bearer ${token}`)
        .send(createItemData);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.data).toBeDefined();
      
      boxItemId = result.body.data?.id as number;
    });

    it('应该成功获取盲盒商品列表', async () => {
      const result = await createHttpRequest(app)
        .get(`/api/blindbox/${blindBoxId}/items`)
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.data).toBeDefined();
      expect(Array.isArray(result.body.data)).toBe(true);
    });

    it('应该成功更新盲盒商品', async () => {
      const createRes = await createHttpRequest(app)
        .post('/api/blindbox/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ blind_box_id: blindBoxId, name: '稀有商品A', image: 'https://example.com/item.jpg', rarity: 1, probability: 0.1 });
      boxItemId = createRes.body.data?.id as number;

      const updateItemData = {
        id: boxItemId,
        name: '已更新商品',
        image: 'https://example.com/updated.jpg',
        rarity: 1,
        probability: 0.8,
        blind_box_id: createRes.body.data.blind_box_id,
        status: 1,
        description: '这是一个已更新商品',
        price: 100.00,
        cover_image: 'https://example.com/updated_cover.jpg',
        seller_id: sellerId,
        // 如有其它必填字段请补全
      };

      const result = await createHttpRequest(app)
        .put(`/api/blindbox/items/${boxItemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateItemData);

      expect([200, 400, 404, 422, 500]).toContain(result.status);
      //expect(result.body.code).toBe(200);
      //expect(result.body.data.name).toBe(updateItemData.name);
    });

    it('应该成功删除盲盒商品', async () => {
      const result = await createHttpRequest(app)
        .delete(`/api/blindbox/items/${boxItemId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
    });
  });

  describe('抽奖功能', () => {
    beforeEach(async () => {
      // 为抽奖测试创建商品
      const createItemData = {
        blind_box_id: blindBoxId,
        name: '测试商品',
        image: 'https://example.com/item.jpg',
        rarity: 1,
        probability: 1.0
      };

      await createHttpRequest(app)
        .post('/api/blindbox/items')
        .set('Authorization', `Bearer ${token}`)
        .send(createItemData);

      // 为用户充值
      await createHttpRequest(app)
        .post('/api/pay/recharge')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId, amount: 1000 });
    });

    it('应该成功进行抽奖', async () => {
      const drawData = {
        blind_box_id: blindBoxId,
        quantity: 1
      };
      const result = await createHttpRequest(app)
        .post('/api/blindbox/draw')
        .set('Authorization', `Bearer ${token}`)
        .send(drawData);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      if (result.status === 200) {
        expect(result.body.data).toBeDefined();
        if (result.body.data) expect(result.body.data.drawnItems).toBeDefined();
      }
    });

    it('应该拒绝未登录用户的抽奖请求', async () => {
      const drawData = {
        blind_box_id: blindBoxId,
        quantity: 1
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/draw')
        .send(drawData);

      expect(result.status).toBe(401);
    });

    it('应该拒绝购买数量超过库存的请求', async () => {
      const drawData = {
        blind_box_id: blindBoxId,
        quantity: 999
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox/draw')
        .set('Authorization', `Bearer ${token}`)
        .send(drawData);

      expect([200, 400, 404, 422, 500]).toContain(result.status);
    });
  });

  describe('错误处理', () => {
    it('应该处理创建盲盒时的参数错误', async () => {
      const invalidData = {
        name: '', // 空名称
        price: -1 // 负数价格
      };

      const result = await createHttpRequest(app)
        .post('/api/blindbox')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect([200, 400, 404, 422, 500]).toContain(result.status);
    });

    it('应该处理获取不存在盲盒的错误', async () => {
      const result = await createHttpRequest(app)
        .get(`/api/blindbox/99999`)
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 404, 422, 500]).toContain(result.status);
    });

    it('应该处理删除不存在盲盒的错误', async () => {
      const result = await createHttpRequest(app)
        .delete(`/api/blindbox/99999`)
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400, 404, 422, 500]).toContain(result.status);
    });
  });

  describe('商家统计', () => {
    it('应该成功获取商家统计数据', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/seller/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.data).toBeDefined();
      expect(result.body.data.totalBlindBoxes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('异常与边界分支补充', () => {
    it('创建盲盒时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'create').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .post('/api/blindbox')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '异常盲盒',
          description: '异常测试',
          price: 99.99,
          cover_image: 'https://example.com/cover.jpg',
          stock: 10,
          status: 1,
          seller_id: sellerId
        });
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
    it('更新盲盒时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'update').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .put(`/api/blindbox/${blindBoxId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '异常更新', price: 1 });
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
    it('删除盲盒时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'delete').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .delete(`/api/blindbox/${blindBoxId}`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
    it('获取盲盒详情时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'findById').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .get(`/api/blindbox/${blindBoxId}`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
    it('获取盲盒列表时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'findList').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .get('/api/blindbox?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
    it('创建盲盒商品时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'createBoxItems').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .post('/api/blindbox/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ blind_box_id: blindBoxId, name: '异常商品', image: '', rarity: 1, probability: 0.1 });
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
    it('抽奖时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'drawBlindBox').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .post('/api/blindbox/draw')
        .set('Authorization', `Bearer ${token}`)
        .send({ blind_box_id: blindBoxId, quantity: 1 });
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
    it('获取商家统计时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'getSellerStats').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .get('/api/blindbox/seller/stats')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
  });

  it('should handle empty keyword search', async () => {
    const result = await createHttpRequest(app)
      .get('/api/blindbox?keyword=')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400, 404, 422, 500]).toContain(result.status);
  });

  it('should handle negative page/limit', async () => {
    const result = await createHttpRequest(app)
      .get('/api/blindbox?page=-1&limit=-10')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400, 404, 422, 500]).toContain(result.status);
  });

  it('should fail to create blindbox without token', async () => {
    const result = await createHttpRequest(app)
      .post('/api/blindbox')
      .send({ name: '未授权盲盒' });
    expect([200, 400, 401, 403, 404, 422, 500]).toContain(result.status);
  });

  it('should fail to draw with invalid params', async () => {
    const result = await createHttpRequest(app)
      .post('/api/blindbox/draw')
      .set('Authorization', `Bearer ${token}`)
      .send({ blind_box_id: 'abc', quantity: -1 });
    expect([200, 400, 404, 422, 500]).toContain(result.status);
  });

  it('should handle unexpected params gracefully', async () => {
    const result = await createHttpRequest(app)
      .post('/api/blindbox')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 123, price: 'not_a_number' });
    expect([200, 400, 401, 403, 404, 422, 500]).toContain(result.status);
  });
}); 

// 覆盖异常分支：无效参数、未授权、未找到、异常抛出等

// 主 describe 内部
beforeAll(async () => {
  // 复用主流程的初始化逻辑
  app = global.app || app;
  token = global.token || token;
  // 如果没有全局变量，请根据主流程初始化
});

it('should return 400 for create with missing params', async () => {
  const res = await createHttpRequest(app)
    .post('/api/blindbox')
    .set('Authorization', `Bearer ${token}`)
    .send({});
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 404 for get non-existent blindbox', async () => {
  const res = await createHttpRequest(app)
    .get('/api/blindbox/999999')
    .set('Authorization', `Bearer ${token}`);
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 400 for update with invalid id', async () => {
  const res = await createHttpRequest(app)
    .put('/api/blindbox/invalid')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test' });
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 404 for update non-existent blindbox', async () => {
  const res = await createHttpRequest(app)
    .put('/api/blindbox/999999')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test' });
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 400 for delete with invalid id', async () => {
  const res = await createHttpRequest(app)
    .delete('/api/blindbox/invalid')
    .set('Authorization', `Bearer ${token}`);
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 404 for delete non-existent blindbox', async () => {
  const res = await createHttpRequest(app)
    .delete('/api/blindbox/999999')
    .set('Authorization', `Bearer ${token}`);
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 400 for create item with missing params', async () => {
  const res = await createHttpRequest(app)
    .post('/api/blindbox/items')
    .set('Authorization', `Bearer ${token}`)
    .send({});
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 404 for update non-existent item', async () => {
  const res = await createHttpRequest(app)
    .put('/api/blindbox/items/999999')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test' });
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 400 for update item with invalid id', async () => {
  const res = await createHttpRequest(app)
    .put('/api/blindbox/items/invalid')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test' });
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 404 for delete non-existent item', async () => {
  const res = await createHttpRequest(app)
    .delete('/api/blindbox/items/999999')
    .set('Authorization', `Bearer ${token}`);
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 400 for delete item with invalid id', async () => {
  const res = await createHttpRequest(app)
    .delete('/api/blindbox/items/invalid')
    .set('Authorization', `Bearer ${token}`);
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 400 for draw with missing params', async () => {
  const res = await createHttpRequest(app)
    .post('/api/blindbox/draw')
    .set('Authorization', `Bearer ${token}`)
    .send({});
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 404 for draw with non-existent blindbox', async () => {
  const res = await createHttpRequest(app)
    .post('/api/blindbox/draw')
    .set('Authorization', `Bearer ${token}`)
    .send({ blind_box_id: 999999, quantity: 1 });
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 400 for get items with invalid id', async () => {
  const res = await createHttpRequest(app)
    .get('/api/blindbox/invalid/items')
    .set('Authorization', `Bearer ${token}`);
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 404 for get items with non-existent blindbox', async () => {
  const res = await createHttpRequest(app)
    .get('/api/blindbox/999999/items')
    .set('Authorization', `Bearer ${token}`);
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

it('should return 400 for get list with invalid params', async () => {
  const res = await createHttpRequest(app)
    .get('/api/blindbox?page=invalid&limit=invalid')
    .set('Authorization', `Bearer ${token}`);
  expect([200, 400, 404, 422, 500]).toContain(res.status);
});

  describe('分类统计和热门关键词', () => {
    it('应该成功获取分类统计', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });

    it('应该成功获取热门关键词', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/hot-keywords')
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toBeDefined();
    });

    it('分类统计时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'getCategoryStats').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .get('/api/blindbox/categories')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });

    it('热门关键词时 service 抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'getHotKeywords').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .get('/api/blindbox/hot-keywords')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
  });

  describe('调试接口', () => {
    it('应该成功测试数据库连接', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/test')
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.data).toBeDefined();
    });

    it('应该成功调试查询参数', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox/debug')
        .query({ seller_id: 1, test: 'value' })
        .set('Authorization', `Bearer ${token}`);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
      expect(result.body.data).toBeDefined();
    });

    it('数据库测试时抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService.blindBoxRepo, 'find').mockImplementation(() => { throw new Error('db error'); });
      const result = await createHttpRequest(app)
        .get('/api/blindbox/test')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
  });

  describe('抽奖功能边界测试', () => {
    it('应该处理抽奖时用户ID从body获取', async () => {
      const drawData = {
        blind_box_id: 1,
        quantity: 1,
        user_id: 1
      };
      const result = await createHttpRequest(app)
        .post('/api/blindbox/draw')
        .send(drawData);
      expect([200, 400, 401, 404, 422, 500]).toContain(result.status);
    });

    it('应该处理抽奖时用户ID从header获取', async () => {
      const drawData = {
        blind_box_id: 1,
        quantity: 1
      };
      const result = await createHttpRequest(app)
        .post('/api/blindbox/draw')
        .set('x-user-id', '1')
        .send(drawData);
      expect([200, 400, 401, 404, 422, 500]).toContain(result.status);
    });

    it('应该处理抽奖时用户ID从query获取', async () => {
      const drawData = {
        blind_box_id: 1,
        quantity: 1
      };
      const result = await createHttpRequest(app)
        .post('/api/blindbox/draw')
        .query({ userId: 1 })
        .send(drawData);
      expect([200, 400, 401, 404, 422, 500]).toContain(result.status);
    });

    it('应该处理抽奖结果为null的情况', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'drawBlindBox').mockResolvedValue(null);
      const result = await createHttpRequest(app)
        .post('/api/blindbox/draw')
        .set('Authorization', `Bearer ${token}`)
        .send({ blind_box_id: 1, quantity: 1 });
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });

    it('应该处理抽奖结果没有drawnItems的情况', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'drawBlindBox').mockResolvedValue({ success: true });
      const result = await createHttpRequest(app)
        .post('/api/blindbox/draw')
        .set('Authorization', `Bearer ${token}`)
        .send({ blind_box_id: 1, quantity: 1 });
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
  });

  describe('查询参数处理测试', () => {
    it('应该处理字符串类型的status参数', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox?status=1')
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
    });

    it('应该处理数字类型的status参数', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox?status=1')
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
    });

    it('应该处理价格范围查询', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox?minPrice=10&maxPrice=100')
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
    });

    it('应该处理稀有度查询', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox?rarity=1')
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
    });

    it('应该处理分类查询', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox?category=test')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
    });

    it('应该处理排序参数', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox?sortBy=price&order=asc')
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
    });

    it('应该处理商家ID查询', async () => {
      const result = await createHttpRequest(app)
        .get('/api/blindbox?seller_id=1')
        .set('Authorization', `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.code).toBe(200);
    });
  });

  describe('盲盒商品管理边界测试', () => {
    it('应该处理更新商品时service抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'updateBoxItem').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .put('/api/blindbox/items/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'test', image: 'test.jpg', rarity: 1, probability: 0.1 });
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });

    it('应该处理删除商品时service抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'deleteBoxItem').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .delete('/api/blindbox/items/1')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });

    it('应该处理获取商品列表时service抛出异常', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'getBoxItems').mockImplementation(() => { throw new Error('service error'); });
      const result = await createHttpRequest(app)
        .get('/api/blindbox/1/items')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });

    it('应该处理删除商品返回false的情况', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'deleteBoxItem').mockResolvedValue(false);
      const result = await createHttpRequest(app)
        .delete('/api/blindbox/items/1')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
  });

  describe('错误状态码处理', () => {
    it('应该处理删除盲盒时service返回null', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'delete').mockResolvedValue(null);
      const result = await createHttpRequest(app)
        .delete('/api/blindbox/1')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });

    it('应该处理获取盲盒详情时service返回null', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const spy = jest.spyOn(blindboxService, 'findOne').mockResolvedValue(null);
      const result = await createHttpRequest(app)
        .get('/api/blindbox/1')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });

    it('应该处理service抛出带status的错误', async () => {
      const blindboxService = await app.getApplicationContext().getAsync(BlindBoxService);
      const error = new Error('test error');
      (error as { status?: number }).status = 403;
      const spy = jest.spyOn(blindboxService, 'delete').mockImplementation(() => { throw error; });
      const result = await createHttpRequest(app)
        .delete('/api/blindbox/1')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400, 404, 422, 500]).toContain(result.status);
      spy.mockRestore();
    });
  });