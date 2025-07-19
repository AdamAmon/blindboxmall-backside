import { MidwayConfig } from '@midwayjs/core';
import * as fs from 'fs';
import * as path from "node:path";
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
      }
    }
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
    appId: '9021000149679684',
    privateKey: fs.readFileSync(path.join(__dirname, '../../private_key.pem'), 'utf8'),
    alipayPublicKey: fs.readFileSync(path.join(__dirname, '../../public_key.pem'), 'utf8'),
    gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
    notifyUrl: 'http://f67afa32.natappfree.cc/api/pay/notify',
    charset: 'utf-8',
    signType: 'RSA2',
    keyType: 'PKCS8',
  },
    // staticFile: {
    //   dirs: {
    //     default: { prefix: '/', dir: 'public' } // 前端构建产物目录
    //   }
    // },
} as MidwayConfig;
