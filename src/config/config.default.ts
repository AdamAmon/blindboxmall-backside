import { MidwayConfig } from '@midwayjs/core';
import * as fs from 'fs';
import * as path from 'node:path';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1752311256323_475',
  koa: {
    port: 7001,
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: path.join(__dirname, '../../data.sqlite'), // 数据库路径
        synchronize: true, // 自动同步实体
        logging: true,
        entities: ['**/entity/**/*.entity{.ts,.js}'],
      },
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_key',
    expiresIn: '30d',
    ignoreExpiration: false,
  },
  // 跨域配置
  crossDomain: {
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowOrigins: ['http://localhost:5173'], // 前端地址
    credentials: true,
  },
  alipay: {
    appId: process.env.ALIPAY_APP_ID || '9021000149679684',
    privateKey:
      process.env.NODE_ENV === 'unittest'
        ? 'test-private-key'
        : fs.readFileSync(
            path.join(__dirname, '../../private_key.pem'),
            'utf8'
          ),
    alipayPublicKey:
      process.env.NODE_ENV === 'unittest'
        ? 'test-public-key'
        : fs.readFileSync(path.join(__dirname, '../../public_key.pem'), 'utf8'),
    gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || '	http://s93eb489.natappfree.cc/api/pay/notify',//开发环境还是采用内网穿透方案，直接使用本地地址支付宝沙箱无法访问本地服务器
    charset: 'utf-8',
    signType: 'RSA2',
    keyType: 'PKCS8',
    // 新增：所有支付相关接口userId默认取当前登录用户
    defaultUserIdFromToken: true,
  },
  staticFile: {
    dirs: {
      default: { prefix: '/', dir: 'public' } // 前端构建产物目录
    },
    dynamic: true,
    historyApiFallback: true
  },
} as MidwayConfig;
