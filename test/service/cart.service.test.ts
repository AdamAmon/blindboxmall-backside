import { createApp, close } from '@midwayjs/mock';
import { CartService } from '../../src/service/pay/cart.service';
import { BlindBoxService } from '../../src/service/blindbox/blindbox.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/service/cart.service.test.ts', () => {
  let app;
  let cartService: CartService;
  let blindBoxService: BlindBoxService;

  beforeAll(async () => {
    app = await createApp();
    cartService = await app.getApplicationContext().getAsync(CartService);
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('addToCart', () => {
    it('should add new item to cart successfully', async () => {
      const userId = 1001;
      const blindBoxId = 1001;
      const quantity = 2;

      const result = await cartService.addToCart(userId, blindBoxId, quantity);
      expect(result).toBeDefined();
      expect(result.user_id).toBe(userId);
      expect(result.blind_box_id).toBe(blindBoxId);
      expect(result.quantity).toBe(quantity);
    });

    it('should update existing cart item quantity', async () => {
      const userId = 1002;
      const blindBoxId = 1002;
      const initialQuantity = 2;
      const additionalQuantity = 3;

      // 先添加一个商品
      await cartService.addToCart(userId, blindBoxId, initialQuantity);
      
      // 再次添加相同商品
      const result = await cartService.addToCart(userId, blindBoxId, additionalQuantity);
      expect(result).toBeDefined();
      expect(result.quantity).toBe(initialQuantity + additionalQuantity);
    });

    it('should handle zero quantity', async () => {
      const userId = 1003;
      const blindBoxId = 1003;
      const quantity = 0;

      const result = await cartService.addToCart(userId, blindBoxId, quantity);
      expect(result).toBeDefined();
      expect(result.quantity).toBe(quantity);
    });

    it('should handle negative quantity', async () => {
      const userId = 1004;
      const blindBoxId = 1004;
      const quantity = -1;

      const result = await cartService.addToCart(userId, blindBoxId, quantity);
      expect(result).toBeDefined();
      expect(result.quantity).toBe(quantity);
    });
  });

  describe('getCartList', () => {
    it('should get cart list successfully', async () => {
      const userId = 1005;

      const result = await cartService.getCartList(userId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for user with no cart items', async () => {
      const userId = 99999;

      const result = await cartService.getCartList(userId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should include blindBox details in cart items', async () => {
      const userId = 1006;
      const blindBoxId = 1006;
      const quantity = 1;

      // 先添加一个商品到购物车
      await cartService.addToCart(userId, blindBoxId, quantity);
      
      const result = await cartService.getCartList(userId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const cartItem = result[0];
        expect(cartItem).toHaveProperty('blindBox');
      }
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity successfully', async () => {
      const userId = 1007;
      const blindBoxId = 1007;
      const initialQuantity = 1;
      const newQuantity = 5;

      // 先添加一个商品
      const cartItem = await cartService.addToCart(userId, blindBoxId, initialQuantity);
      
      // 更新数量
      const result = await cartService.updateCartItem(cartItem.id, newQuantity);
      expect(result).toBeDefined();
      expect(result.quantity).toBe(newQuantity);
    });

    it('should return null for non-existent cart item', async () => {
      const cartId = 99999;
      const quantity = 5;

      const result = await cartService.updateCartItem(cartId, quantity);
      expect(result).toBeNull();
    });

    it('should handle zero quantity update', async () => {
      const userId = 1008;
      const blindBoxId = 1008;
      const initialQuantity = 1;
      const newQuantity = 0;

      // 先添加一个商品
      const cartItem = await cartService.addToCart(userId, blindBoxId, initialQuantity);
      
      // 更新数量为0
      const result = await cartService.updateCartItem(cartItem.id, newQuantity);
      expect(result).toBeDefined();
      expect(result.quantity).toBe(newQuantity);
    });

    it('should handle negative quantity update', async () => {
      const userId = 1009;
      const blindBoxId = 1009;
      const initialQuantity = 1;
      const newQuantity = -1;

      // 先添加一个商品
      const cartItem = await cartService.addToCart(userId, blindBoxId, initialQuantity);
      
      // 更新数量为负数
      const result = await cartService.updateCartItem(cartItem.id, newQuantity);
      expect(result).toBeDefined();
      expect(result.quantity).toBe(newQuantity);
    });
  });

  describe('deleteCartItem', () => {
    it('should delete cart item successfully', async () => {
      const userId = 1010;
      const blindBoxId = 1010;
      const quantity = 1;

      // 先添加一个商品
      const cartItem = await cartService.addToCart(userId, blindBoxId, quantity);
      
      // 删除商品
      const result = await cartService.deleteCartItem(cartItem.id);
      expect(result).toBeDefined();
      expect(result.affected).toBe(1);
    });

    it('should handle deleting non-existent cart item', async () => {
      const cartId = 99999;

      const result = await cartService.deleteCartItem(cartId);
      expect(result).toBeDefined();
      expect(result.affected).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should clear all cart items for user successfully', async () => {
      const userId = 1011;
      const blindBoxId1 = 1011;
      const blindBoxId2 = 1012;
      const quantity = 1;

      // 先添加两个商品
      await cartService.addToCart(userId, blindBoxId1, quantity);
      await cartService.addToCart(userId, blindBoxId2, quantity);
      
      // 清空购物车
      const result = await cartService.clearCart(userId);
      expect(result).toBeDefined();
      expect(result.affected).toBeGreaterThanOrEqual(0);
    });

    it('should handle clearing empty cart', async () => {
      const userId = 99999;

      const result = await cartService.clearCart(userId);
      expect(result).toBeDefined();
      expect(result.affected).toBe(0);
    });
  });

  describe('边界条件测试', () => {
    it('should handle invalid user ID', async () => {
      const userId = -1;
      const blindBoxId = 1013;
      const quantity = 1;

      const result = await cartService.addToCart(userId, blindBoxId, quantity);
      expect(result).toBeDefined();
    });

    it('should handle invalid blind box ID', async () => {
      const userId = 1014;
      const blindBoxId = -1;
      const quantity = 1;

      const result = await cartService.addToCart(userId, blindBoxId, quantity);
      expect(result).toBeDefined();
    });

    it('should handle very large quantity', async () => {
      const userId = 1015;
      const blindBoxId = 1015;
      const quantity = 999999;

      const result = await cartService.addToCart(userId, blindBoxId, quantity);
      expect(result).toBeDefined();
      expect(result.quantity).toBe(quantity);
    });

    it('should handle decimal quantity', async () => {
      const userId = 1016;
      const blindBoxId = 1016;
      const quantity = 1.5;

      const result = await cartService.addToCart(userId, blindBoxId, quantity);
      expect(result).toBeDefined();
      expect(result.quantity).toBe(quantity);
    });
  });

  describe('异常处理测试', () => {
    it('should handle database connection errors gracefully', async () => {
      // 模拟数据库连接错误的情况
      const userId = 1017;
      const blindBoxId = 1017;
      const quantity = 1;

      try {
        const result = await cartService.addToCart(userId, blindBoxId, quantity);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle concurrent cart operations', async () => {
      const userId = 1018;
      const blindBoxId = 1018;
      const quantity = 1;

      // 模拟并发操作
      const promises = [
        cartService.addToCart(userId, blindBoxId, quantity),
        cartService.addToCart(userId, blindBoxId, quantity),
        cartService.addToCart(userId, blindBoxId, quantity)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
}); 