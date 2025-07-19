import { MidwayConfig } from '@midwayjs/core';
import { User } from '../entity/user/user.entity';
import { UserAddress } from '../entity/address/user_address.entity';
import { Recharge } from '../entity/pay/pay.entity';

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
        entities: [User, UserAddress, Recharge],
      },
    },
  },
  // 添加JWT配置
  jwt: {
    secret: 'your-test-secret',
    expiresIn: '1h', // 测试环境下设置短一点
  },
  // 添加安全配置
  security: {
    csrf: {
      enable: false, // 测试环境禁用CSRF保护
    },
  },
  // 添加支付宝测试配置
  alipay: {
    appId: 'test-app-id',
    privateKey: 'test-private-key',
    alipayPublicKey: 'test-public-key',
    gateway: 'https://openapi.alipaydev.com/gateway.do',
    notifyUrl: 'http://test.com/notify',
  },
} as MidwayConfig;
