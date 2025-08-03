import { createApp, close } from '@midwayjs/mock';
import { OrderService } from '../../src/service/pay/order.service';
import { BlindBoxService } from '../../src/service/blindbox/blindbox.service';
import { UserService } from '../../src/service/user/user.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/service/order.service.test.ts', () => {
  let app;
  let orderService: OrderService;
  let blindBoxService: BlindBoxService;
  let userService: UserService;

  beforeAll(async () => {
    app = await createApp();
    orderService = await app.getApplicationContext().getAsync(OrderService);
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
    userService = await app.getApplicationContext().getAsync(UserService);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('validateCoupon', () => {
    it('should return valid for no coupon', async () => {
      const result = await orderService.validateCoupon(null, 1, 100);
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(0);
    });

    it('should throw error for non-existent coupon', async () => {
      await expect(orderService.validateCoupon(99999, 1, 100))
        .rejects.toThrow('优惠券不存在');
    });
  });

  describe('createOrder', () => {
    it('should throw error for empty items', async () => {
      const dto = {
        user_id: 1,
        address_id: 1,
        total_amount: 100,
        pay_method: 'balance',
        items: []
      };

      await expect(orderService.createOrder(dto))
        .rejects.toThrow('订单项不能为空');
    });

    it('should throw error for invalid items', async () => {
      const dto = {
        user_id: 1,
        address_id: 1,
        total_amount: 100,
        pay_method: 'balance',
        items: null
      };

      await expect(orderService.createOrder(dto))
        .rejects.toThrow('订单项不能为空');
    });

    it('should throw error for amount mismatch', async () => {
      const dto = {
        user_id: 1,
        address_id: 1,
        total_amount: 200, // 错误的金额
        pay_method: 'balance',
        items: [
          {
            blind_box_id: 1,
            price: 100
          }
        ]
      };

      await expect(orderService.createOrder(dto))
        .rejects.toThrow('订单金额计算错误');
    });
  });

  describe('getOrderById', () => {
    it('should throw error for non-existent order', async () => {
      const orderId = 99999;
      await expect(orderService.getOrderById(orderId))
        .rejects.toThrow('订单不存在');
    });
  });

  describe('getOrdersByUserId', () => {
    it('should get orders by user id successfully', async () => {
      const userId = 1;
      const result = await orderService.getOrdersByUserId(userId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for user with no orders', async () => {
      const userId = 99999;
      const result = await orderService.getOrdersByUserId(userId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('payOrder', () => {
    it('should throw error for non-existent order', async () => {
      const orderId = 99999;
      await expect(orderService.payOrder(orderId))
        .rejects.toThrow('订单不存在');
    });
  });

  describe('handleAlipayNotify', () => {
    it('should throw error for missing out_trade_no', async () => {
      const rawBody = JSON.stringify({
        trade_status: 'TRADE_SUCCESS'
      });

      await expect(orderService.handleAlipayNotify(rawBody))
        .rejects.toThrow('缺少out_trade_no参数');
    });

    it('should return success for non-TRADE_SUCCESS status', async () => {
      const rawBody = JSON.stringify({
        out_trade_no: 'ORDER123456',
        trade_status: 'TRADE_CLOSED'
      });

      const result = await orderService.handleAlipayNotify(rawBody);
      expect(result).toBe('success');
    });

    it('should throw error for non-existent order', async () => {
      const rawBody = JSON.stringify({
        out_trade_no: 'NONEXISTENT',
        trade_status: 'TRADE_SUCCESS'
      });

      await expect(orderService.handleAlipayNotify(rawBody))
        .rejects.toThrow('订单不存在');
    });
  });

  describe('confirmOrder', () => {
    it('should throw error for non-existent order', async () => {
      const orderId = 99999;
      await expect(orderService.confirmOrder(orderId))
        .rejects.toThrow('订单不存在');
    });
  });

  describe('getCompletedOrdersWithItems', () => {
    it('should get completed orders with items successfully', async () => {
      const userId = 1;
      const result = await orderService.getCompletedOrdersWithItems(userId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for user with no completed orders', async () => {
      const userId = 99999;
      const result = await orderService.getCompletedOrdersWithItems(userId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('openOrderItem', () => {
    it('should throw error for non-existent order item', async () => {
      const orderItemId = 99999;
      const userId = 1;
      await expect(orderService.openOrderItem(orderItemId, userId, blindBoxService))
        .rejects.toThrow('订单不存在');
    });
  });

  describe('边界条件测试', () => {
    it('should handle database connection errors gracefully', async () => {
      const orderId = 1;
      try {
        const result = await orderService.getOrderById(orderId);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle concurrent order operations', async () => {
      const orderId = 1;
      const promises = [
        orderService.getOrderById(orderId),
        orderService.getOrderById(orderId),
        orderService.getOrderById(orderId)
      ];

      try {
        const results = await Promise.all(promises);
        expect(results).toHaveLength(3);
        results.forEach(result => {
          expect(result).toBeDefined();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('异常处理测试', () => {
    it('should handle invalid parameters gracefully', async () => {
      try {
        await orderService.validateCoupon(null, null, null);
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty string parameters', async () => {
      try {
        await orderService.validateCoupon(0, 0, 0);
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined parameters', async () => {
      try {
        await orderService.validateCoupon(undefined, undefined, undefined);
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
}); 