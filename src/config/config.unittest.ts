import { MidwayConfig } from '@midwayjs/core';
import { User } from '../entity/user/user.entity';
import { UserAddress } from '../entity/address/user_address.entity';
import { Recharge } from '../entity/pay/recharge.entity';
import { BlindBox } from '../entity/blindbox/blindbox.entity';
import { BoxItem } from '../entity/blindbox/box-item.entity';
import { Order } from '../entity/pay/order.entity';
import { OrderItem } from '../entity/pay/order-item.entity';

export default {
  koa: {
    port: null, // 随机端口避免冲突
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: ':memory:', // 使用内存数据库
        synchronize: true,
        logging: false,
        entities: [User, UserAddress, Recharge, BlindBox, BoxItem, Order, OrderItem],
      },
    },
  },
  // 添加JWT配置
  jwt: {
    secret: 'your-test-secret',
    expiresIn: '1h', // 测试环境设置短一点
  },
  // 添加安全配置
  security: {
    csrf: {
      enable: false, // 测试环境禁用CSRF保护
    },
  },
  // 添加支付宝测试配置
  alipay: {
    appId: '2021000122123456',
    privateKey: `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz\n-----END RSA PRIVATE KEY-----`,
    alipayPublicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdefghijklmnopqrstuvwxyz\n-----END PUBLIC KEY-----`,
    gateway: 'https://openapi.alipaydev.com/gateway.do',
    notifyUrl: 'http://test.com/notify',
    testMode: true,
    mockResponse: true, // 启用模拟响应
    // 新增：测试环境下强制所有支付接口必须传递userId
    requireUserId: true,
    // 新增：所有支付相关接口userId默认取当前登录用户
    defaultUserIdFromToken: true,
  },
} as MidwayConfig;
