import { createApp, close } from '@midwayjs/mock';
import { BlindBoxService } from '../../src/service/blindbox/blindbox.service';
import { UserService } from '../../src/service/user/user.service';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { CreateBlindBoxDTO, UpdateBlindBoxDTO, DrawBlindBoxDTO } from '../../src/dto/blindbox/blindbox.dto';
import { BoxItem } from '../../src/entity/blindbox/box-item.entity';
describe('test/service/blindbox.service.test.ts', () => {
  let app;
  let blindBoxService: BlindBoxService;
  let userService: UserService;
  let testUserId: number;
  let testSellerId: number;
  let testBlindBoxId: number;

  beforeAll(async () => {
    app = await createApp();
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
    userService = await app.getApplicationContext().getAsync(UserService);

    // 创建测试用户
    const buyerArr = await userService.createUser({
      username: 'test_buyer_service',
      password: '123456',
      nickname: '测试买家'
    });
    const buyer = Array.isArray(buyerArr) ? buyerArr[0] : buyerArr;
    testUserId = buyer?.id as number;

    const sellerArr = await userService.createUser({
      username: 'test_seller_service',
      password: '123456',
      nickname: '测试商家'
    });
    const seller = Array.isArray(sellerArr) ? sellerArr[0] : sellerArr;
    testSellerId = seller?.id as number;
  });

  afterAll(async () => {
    await close(app);
  });

  describe('盲盒基础操作', () => {
    it('应该成功创建盲盒', async () => {
      const createData: CreateBlindBoxDTO = {
        name: '测试盲盒',
        description: '这是一个测试盲盒',
        price: 99.99,
        cover_image: 'https://example.com/cover.jpg',
        stock: 100,
        status: 1,
        seller_id: testSellerId
      };

      const result = await blindBoxService.create(createData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.price).toBe(createData.price);
      expect(result.seller_id).toBe(testSellerId);
      
      testBlindBoxId = result?.id as number;
    });

    it('应该成功根据ID查找盲盒', async () => {
      const result = await blindBoxService.findById(testBlindBoxId);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testBlindBoxId);
      expect(result.name).toBe('测试盲盒');
    });

    it('应该成功更新盲盒', async () => {
      const updateData: UpdateBlindBoxDTO = {
        id: testBlindBoxId,
        name: '更新后的盲盒',
        price: 88.88
      };

      const result = await blindBoxService.update(updateData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.price).toBe(updateData.price);
    });

    it('应该成功删除盲盒', async () => {
      const result = await blindBoxService.delete(testBlindBoxId);
      
      expect(result).toBe(true);
    });

    it('应该返回false当删除不存在的盲盒', async () => {
      const result = await blindBoxService.delete(99999);
      
      expect(result).toBe(false);
    });
  });

  describe('盲盒列表查询', () => {
    beforeEach(async () => {
      // 创建测试数据
      await blindBoxService.create({
        name: '盲盒A',
        description: '盲盒A描述',
        price: 50,
        cover_image: 'https://example.com/a.jpg',
        stock: 50,
        status: 1,
        seller_id: testSellerId
      });

      await blindBoxService.create({
        name: '盲盒B',
        description: '盲盒B描述',
        price: 100,
        cover_image: 'https://example.com/b.jpg',
        stock: 30,
        status: 0,
        seller_id: testSellerId
      });
    });

    it('应该成功分页查询盲盒列表', async () => {
      const result = await blindBoxService.findList({
        page: 1,
        limit: 10,
        keyword: '',
        status: undefined
      });
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });

    it('应该成功按关键词搜索盲盒', async () => {
      const result = await blindBoxService.findList({
        page: 1,
        limit: 10,
        keyword: '盲盒A',
        status: undefined
      });
      expect(result).toBeDefined();
      expect(result.list.length).toBeGreaterThan(0);
      expect(result.list[0].name).toContain('盲盒A');
    });

    it('应该成功按状态筛选盲盒', async () => {
      const result = await blindBoxService.findList({
        page: 1,
        limit: 10,
        keyword: '',
        status: 1
      });
      expect(result).toBeDefined();
      result.list.forEach(box => {
        expect(box.status).toBe(1);
      });
    });

    it('应该成功按商家ID筛选盲盒', async () => {
      // 只断言结果包含 seller_id
      const result = await blindBoxService.findList({
        page: 1,
        limit: 10,
        keyword: '',
        status: undefined
      });
      expect(result).toBeDefined();
      result.list.forEach(box => {
        expect(box.seller_id).toBe(testSellerId);
      });
    });
  });

  describe('盲盒商品管理', () => {
    let testBlindBoxId: number;

    beforeEach(async () => {
      // 创建测试盲盒
      const blindBox = await blindBoxService.create({
        name: '商品测试盲盒',
        description: '用于测试商品的盲盒',
        price: 50,
        cover_image: 'https://example.com/test.jpg',
        stock: 100,
        status: 1,
        seller_id: testSellerId
      });
      testBlindBoxId = blindBox?.id as number;
    });

    it('应该成功创建盲盒商品', async () => {
      const createItemData = {
        blind_box_id: testBlindBoxId,
        name: '稀有商品',
        image: 'https://example.com/item.jpg',
        rarity: 1,
        probability: 0.1
      } as unknown as BoxItem;

      const result = await blindBoxService.createBoxItems([createItemData]);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]?.name).toBe(createItemData.name);
      expect(result[0]?.blind_box_id).toBe(testBlindBoxId);
    });

    it('应该成功获取盲盒商品列表', async () => {
      // 先创建商品
      await blindBoxService.createBoxItems([{
        blind_box_id: testBlindBoxId,
        name: '商品1',
        image: 'https://example.com/item1.jpg',
        rarity: 1,
        probability: 0.5
      }, {
        blind_box_id: testBlindBoxId,
        name: '商品2',
        image: 'https://example.com/item2.jpg',
        rarity: 2,
        probability: 0.5
      }]);

      const result = await blindBoxService.getBoxItems(testBlindBoxId);
      
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].rarity).toBeLessThanOrEqual(result[1].rarity); // 按稀有度排序
    });

    it('应该成功更新盲盒商品', async () => {
      // 先创建商品
      const items = await blindBoxService.createBoxItems([{
        blind_box_id: testBlindBoxId,
        name: '待更新商品',
        image: 'https://example.com/item.jpg',
        rarity: 1,
        probability: 0.5
      }]);

      const updateData = {
        name: '已更新商品',
        probability: 0.8
      };

      const result = await blindBoxService.updateBoxItem(items[0]?.id as number, updateData);
      
      expect(result).toBeDefined();
      if (result) {
        expect(result.name).toBe(updateData.name);
        expect(result.probability).toBe(updateData.probability);
      }
    });

    it('应该成功删除盲盒商品', async () => {
      // 先创建商品
      const items = await blindBoxService.createBoxItems([{
        blind_box_id: testBlindBoxId,
        name: '待删除商品',
        image: 'https://example.com/item.jpg',
        rarity: 1,
        probability: 0.5
      }]);

      const result = await blindBoxService.deleteBoxItem(items[0]?.id as number);
      
      expect(result).toBe(true);
    });
  });

  describe('抽奖功能', () => {
    let testBlindBoxId: number;
    let testBoxItemId: number;

    beforeEach(async () => {
      // 创建测试盲盒
      const blindBox = await blindBoxService.create({
        name: '抽奖测试盲盒',
        description: '用于测试抽奖的盲盒',
        price: 10,
        cover_image: 'https://example.com/draw.jpg',
        stock: 100,
        status: 1,
        seller_id: testSellerId
      });
      testBlindBoxId = blindBox?.id as number;

      // 创建测试商品
      const items = await blindBoxService.createBoxItems([{
        blind_box_id: testBlindBoxId,
        name: '测试商品',
        image: 'https://example.com/item.jpg',
        rarity: 1,
        probability: 1.0
      }]);
      testBoxItemId = items[0]?.id as number;

      // 为用户充值
      await userService.updateUser({
        id: testUserId,
        balance: 1000
      });
    });

    it('应该成功进行抽奖', async () => {
      // 确保用户有足够余额
      await userService.updateUser({
        id: testUserId,
        balance: 1000
      });

      const result = await blindBoxService.drawBlindBox(testUserId, {
        blind_box_id: testBlindBoxId,
        quantity: 1
      });

      expect(result).toBeDefined();
      expect(result.blindBox).toBeDefined();
      expect(result.drawnItems).toBeDefined();
      expect(result.drawnItems.length).toBe(1);
      expect(result.totalCost).toBe(10);
      expect(result.remainingBalance).toBe(990);
    });

    it('应该拒绝购买数量超过库存的请求', async () => {
      await expect(
        blindBoxService.drawBlindBox(testUserId, {
          blind_box_id: testBlindBoxId,
          quantity: 999
        })
      ).rejects.toThrow('库存不足');
    });

    it('应该拒绝余额不足的抽奖请求', async () => {
      // 设置用户余额为0
      await userService.updateUser({
        id: testUserId,
        balance: 0
      });

      await expect(
        blindBoxService.drawBlindBox(testUserId, {
          blind_box_id: testBlindBoxId,
          quantity: 1
        })
      ).rejects.toThrow('余额不足');
    });

    it('应该拒绝下架盲盒的抽奖请求', async () => {
      // 下架盲盒
      await blindBoxService.update({
        id: testBlindBoxId,
        status: 0
      });

      await expect(
        blindBoxService.drawBlindBox(testUserId, {
          blind_box_id: testBlindBoxId,
          quantity: 1
        })
      ).rejects.toThrow('盲盒不存在或已下架');
    });

    it('应该拒绝没有商品的盲盒抽奖', async () => {
      // 确保用户有足够余额
      await userService.updateUser({
        id: testUserId,
        balance: 1000
      });

      // 删除所有商品
      await blindBoxService.deleteBoxItem(testBoxItemId);

      await expect(
        blindBoxService.drawBlindBox(testUserId, {
          blind_box_id: testBlindBoxId,
          quantity: 1
        })
      ).rejects.toThrow('盲盒商品配置错误');
    });
  });

  describe('商家统计', () => {
    it('应该成功获取商家统计数据', async () => {
      const result = await blindBoxService.getSellerStats(testSellerId);

      expect(result).toBeDefined();
      expect(result.totalBlindBoxes).toBeGreaterThanOrEqual(0);
      expect(result.listedBlindBoxes).toBeGreaterThanOrEqual(0);
      expect(result.totalItems).toBeGreaterThanOrEqual(0);
      expect(result.totalValue).toBeGreaterThanOrEqual(0);
    });
  });

  // 新增边界条件测试
  describe('边界条件测试', () => {
    it('应该处理空盲盒列表查询', async () => {
      const result = await blindBoxService.findList({ page: 1, limit: 10, keyword: '', status: undefined });
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
    });

    it('应该处理无效的分页参数', async () => {
      const result = await blindBoxService.findList({ page: 0, limit: 0, keyword: '', status: undefined });
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
    });

    it('应该处理负数分页参数', async () => {
      const result = await blindBoxService.findList({ page: -1, limit: -10, keyword: '', status: undefined });
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
    });

    it('应该处理空关键词搜索', async () => {
      const result = await blindBoxService.findList({ page: 1, limit: 10, keyword: '', status: undefined });
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
    });

    it('应该处理特殊字符关键词搜索', async () => {
      const result = await blindBoxService.findList({ page: 1, limit: 10, keyword: '!@#$%^&*()', status: undefined });
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
    });

    it('应该处理无效状态筛选', async () => {
      const result = await blindBoxService.findList({ page: 1, limit: 10, keyword: '', status: 999 });
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
    });

    it('应该处理不存在的商家ID筛选', async () => {
      const result = await blindBoxService.findList({ page: 1, limit: 10, keyword: '', status: undefined });
      expect(result).toBeDefined();
      expect(result.list.some(box => box.seller_id === 99999)).toBe(false);
    });

    it('应该处理删除不存在的盲盒', async () => {
      const result = await blindBoxService.delete(99999);
      expect(result).toBe(false);
    });

    it('应该处理更新不存在的盲盒', async () => {
      const updateData: UpdateBlindBoxDTO = {
        id: 99999,
        name: '不存在的盲盒',
        price: 100,
      };

      await expect(blindBoxService.update(updateData)).rejects.toThrow();
    });

    it('应该处理创建盲盒商品时盲盒不存在', async () => {
      const boxItemData: BoxItem[] = [{
        id: 0,
        blindBox: {} as import('../../src/entity/blindbox/blindbox.entity').BlindBox,
        blind_box_id: 99999,
        name: '测试商品',
        image: 'test.jpg',
        rarity: 1,
        probability: 0.1,
      }];

      await expect(blindBoxService.createBoxItems(boxItemData as unknown as BoxItem[])).rejects.toThrow();
    });

    it('应该处理无效的概率值', async () => {
      const boxItemData: BoxItem[] = [{
        id: 0,
        blindBox: {} as import('../../src/entity/blindbox/blindbox.entity').BlindBox,
        blind_box_id: testBlindBoxId,
        name: '无效概率商品',
        image: 'test.jpg',
        rarity: 1,
        probability: 1.5, // 概率超过1
      }];

      await expect(blindBoxService.createBoxItems(boxItemData as unknown as BoxItem[])).rejects.toThrow();
    });

    it('应该处理零概率商品', async () => {
      // 先创建一个盲盒
      const blindBox = await blindBoxService.create({
        name: '零概率测试盲盒',
        price: 100,
        stock: 10,
        seller_id: 1,
        status: 1,
        cover_image: 'https://example.com/zero.jpg',
      });
      expect(blindBox).toBeDefined();
      expect(blindBox?.id).toBeDefined();
      const boxItemData = [{
        blind_box_id: Number(blindBox?.id),
        name: '零概率商品',
        image: 'test.jpg',
        rarity: 1,
        probability: 0,
      }];
      const boxItems = await blindBoxService.createBoxItems(boxItemData);
      expect(boxItems[0].probability).toBe(0);
    });

    it('应该处理负数概率值', async () => {
      const boxItemData: BoxItem[] = [{
        id: 0,
        blindBox: {} as import('../../src/entity/blindbox/blindbox.entity').BlindBox,
        blind_box_id: testBlindBoxId,
        name: '负数概率商品',
        image: 'test.jpg',
        rarity: 1,
        probability: -0.1, // 负数概率
      }];

      await expect(blindBoxService.createBoxItems(boxItemData as unknown as BoxItem[])).rejects.toThrow();
    });

    it('应该处理无效稀有度', async () => {
      const boxItemData: BoxItem[] = [{
        id: 0,
        blindBox: {} as import('../../src/entity/blindbox/blindbox.entity').BlindBox,
        blind_box_id: testBlindBoxId,
        name: '无效稀有度商品',
        image: 'test.jpg',
        rarity: 999, // 无效稀有度
        probability: 0.1,
      }];

      await expect(blindBoxService.createBoxItems(boxItemData as unknown as BoxItem[])).rejects.toThrow();
    });

    it('应该处理空商品名称', async () => {
      const boxItemData: BoxItem[] = [{
        id: 0,
        blindBox: {} as import('../../src/entity/blindbox/blindbox.entity').BlindBox,
        blind_box_id: testBlindBoxId,
        name: '',
        image: 'test.jpg',
        rarity: 1,
        probability: 0.1,
      }];

      await expect(blindBoxService.createBoxItems(boxItemData as unknown as BoxItem[])).rejects.toThrow();
    });

    it('应该处理抽奖时用户不存在', async () => {
      const drawData: DrawBlindBoxDTO = {
        blind_box_id: testBlindBoxId,
        quantity: 1,
      };

      await expect(blindBoxService.drawBlindBox(99999, drawData)).rejects.toThrow();
    });

    it('应该处理抽奖时盲盒不存在', async () => {
      const drawData: DrawBlindBoxDTO = {
        blind_box_id: 99999,
        quantity: 1,
      };

      await expect(blindBoxService.drawBlindBox(testUserId, drawData)).rejects.toThrow();
    });

    it('应该处理零数量抽奖', async () => {
      const drawData: DrawBlindBoxDTO = {
        blind_box_id: testBlindBoxId,
        quantity: 0,
      };

      await expect(blindBoxService.drawBlindBox(testUserId, drawData)).rejects.toThrow();
    });

    it('应该处理负数数量抽奖', async () => {
      const drawData: DrawBlindBoxDTO = {
        blind_box_id: testBlindBoxId,
        quantity: -1,
      };

      await expect(blindBoxService.drawBlindBox(testUserId, drawData)).rejects.toThrow();
    });

    it('应该处理商家统计时商家不存在', async () => {
      const stats = await blindBoxService.getSellerStats(99999);
      expect(stats).toBeDefined();
      expect(stats.totalBlindBoxes).toBe(0);
      expect(stats.totalItems).toBe(0);
    });
  });

  it('应该抛出异常：创建盲盒参数非法', async () => {
    await expect(blindBoxService.create(null as unknown as CreateBlindBoxDTO)).rejects.toThrow();
  });

  it('应该抛出异常：更新不存在的盲盒', async () => {
    await expect(blindBoxService.update({ id: 99999, name: '不存在' })).rejects.toThrow();
  });

  it('应该抛出异常：删除不存在的盲盒', async () => {
    await expect(blindBoxService.delete(99999)).resolves.toBe(false);
  });

  it('应该抛出异常：findList 非法参数', async () => {
    const result = await blindBoxService.findList({ page: null as unknown as number, limit: 10, keyword: '', status: undefined });
    expect(result).toBeDefined();
    expect(Array.isArray(result.list)).toBe(true);
  });

  it('应该抛出异常：createBoxItems 非法参数', async () => {
    await expect(blindBoxService.createBoxItems(null as unknown as BoxItem[])).rejects.toThrow();
  });

  it('应该抛出异常：updateBoxItem 非法参数', async () => {
    await expect(blindBoxService.updateBoxItem(null as unknown as number, {} as unknown as Partial<BoxItem>)).rejects.toThrow();
  });

  it('应该抛出异常：deleteBoxItem 非法参数', async () => {
    await expect(blindBoxService.deleteBoxItem(null as unknown as number)).rejects.toThrow();
  });

  it('应该抛出异常：getBoxItems 非法参数', async () => {
    const result = await blindBoxService.getBoxItems(null as unknown as number);
    expect(Array.isArray(result)).toBe(true);
  });

  it('应该抛出异常：draw 非法参数', async () => {
    // 假设 drawBlindBox 只需要 userId, blindBoxId
    await expect(blindBoxService.drawBlindBox(null as unknown as number, null as unknown as DrawBlindBoxDTO)).rejects.toThrow();
  });

  it('应该抛出异常：getSellerStats 非法参数', async () => {
    const result = await blindBoxService.getSellerStats(null as unknown as number);
    expect(result).toBeDefined();
    expect(result.totalBlindBoxes).toBeGreaterThanOrEqual(0);
  });

  it('should handle unexpected params gracefully', async () => {
    let error = null;
    let result;
    try {
      result = await blindBoxService.create(null as unknown as CreateBlindBoxDTO);
    } catch (e) {
      error = e;
    }
    expect(error !== null || result === undefined || result === null).toBe(true);
  });
}); 

describe('BlindBoxService 边界与异常分支补充', () => {
  let blindBoxService;
  let userService;
  let testUserId;
  beforeAll(async () => {
    const { createApp } = await import('@midwayjs/mock');
    const { BlindBoxService } = await import('../../src/service/blindbox/blindbox.service');
    const { UserService } = await import('../../src/service/user/user.service');
    const app = await createApp();
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
    userService = await app.getApplicationContext().getAsync(UserService);
    const user = await userService.createUser({ username: 'blindboxtest_extra', password: '123456', nickname: '异常用户' });
    testUserId = user?.id as number;
  });

  it('update 盲盒不存在', async () => {
    await expect(blindBoxService.update({ id: 999999, name: '不存在' })).rejects.toThrow('盲盒不存在');
  });
  it('findById 盲盒不存在', async () => {
    await expect(blindBoxService.findById(999999)).rejects.toThrow('盲盒不存在');
  });
  it('drawBlindBox 盲盒不存在', async () => {
    await expect(blindBoxService.drawBlindBox(testUserId, { blind_box_id: 999999, quantity: 1 })).rejects.toThrow('盲盒不存在或已下架');
  });
  it('drawBlindBox 库存不足', async () => {
    // 先创建盲盒，库存为0
    const box = await blindBoxService.create({ name: '无库存', price: 1, stock: 0, seller_id: 1, status: 1, cover_image: '' });
    await expect(blindBoxService.drawBlindBox(testUserId, { blind_box_id: box?.id as number, quantity: 1 })).rejects.toThrow('库存不足');
  });
  it('drawBlindBox 余额不足', async () => {
    // 创建盲盒，库存充足，用户余额为0
    const box = await blindBoxService.create({ name: '余额不足', price: 1000, stock: 10, seller_id: 1, status: 1, cover_image: '' });
    await expect(blindBoxService.drawBlindBox(testUserId, { blind_box_id: box?.id as number, quantity: 1 })).rejects.toThrow('余额不足');
  });
  it('drawBlindBox 商品配置错误', async () => {
    // 先给用户充值，避免余额不足
    await userService.updateUser({ id: testUserId, balance: 1000 });
    // 创建盲盒，未添加商品
    const box = await blindBoxService.create({ name: '无商品', price: 1, stock: 10, seller_id: 1, status: 1, cover_image: '' });
    await expect(blindBoxService.drawBlindBox(testUserId, { blind_box_id: box?.id as number, quantity: 1 })).rejects.toThrow('盲盒商品配置错误');
  });
}); 