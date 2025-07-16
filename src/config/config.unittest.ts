import { MidwayConfig } from '@midwayjs/core';

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
        entities: [
          '**/entity/*.entity{.ts,.js}'
        ],
      }
    }
  },
  // 添加JWT配置
  jwt: {
    secret: 'your-test-secret',
    expiresIn: '1h', // 测试环境下设置短一点
  },
  // 添加安全配置
  security: {
    csrf: {
      enable: false // 测试环境禁用CSRF保护
    }
  }
} as MidwayConfig;
