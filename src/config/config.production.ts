import { MidwayConfig } from '@midwayjs/core';
import * as fs from 'fs';
import * as path from 'node:path';

// 辅助函数：安全读取文件
function safeReadFile(filePath: string, defaultValue: string = ''): string {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (error) {
    console.warn(`无法读取文件 ${filePath}:`, error.message);
  }
  return defaultValue;
}

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: process.env.APP_KEYS || '1752311256323_475',
  koa: {
    port: parseInt(process.env.PORT) || 7001,
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: path.join(__dirname, '../../data.sqlite'), // 数据库路径
        synchronize: false, // 生产环境关闭自动同步
        logging: false, // 生产环境关闭SQL日志
        entities: ['**/entity/**/*.entity{.ts,.js}'],
      },
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-production-secret-key-change-this',
    expiresIn: '30d',
    ignoreExpiration: false,
  },
  // 跨域配置 - 生产环境
  crossDomain: {
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowOrigins: [
      'http://192.168.184.1:7001', // 生产环境后端地址
      'http://192.168.184.1:5173', // 生产环境前端地址
      'http://127.0.0.1:7001', // 本地开发地址
      'http://127.0.0.1:5173', // 本地前端地址
      process.env.FRONTEND_URL || 'http://192.168.184.1:5173' // 从环境变量读取前端地址
    ],
    credentials: true,
  },
  alipay: {
    // 支付宝生产环境配置
    appId: process.env.ALIPAY_APP_ID || 'your-production-app-id',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || safeReadFile(
      path.join(__dirname, '../../private_key.pem'),
      ''
    ),
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || safeReadFile(
      path.join(__dirname, '../../public_key.pem'),
      ''
    ),
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do', // 生产环境网关
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://192.168.184.1:7001/api/pay/notify', // 生产环境回调地址
    charset: 'utf-8',
    signType: 'RSA2',
    keyType: 'PKCS8',
    // 生产环境配置
    defaultUserIdFromToken: true,
    testMode: false, // 生产环境关闭测试模式
    mockResponse: false, // 生产环境关闭模拟响应
  },
  staticFile: {
    dirs: {
      default: { prefix: '/', dir: 'public' } // 前端构建产物目录
    },
    dynamic: true,
    historyApiFallback: true
  },
  // 生产环境日志配置
  logger: {
    level: 'info',
    consoleLevel: 'info',
  },
  // 生产环境安全配置
  security: {
    csrf: {
      enable: true, // 生产环境启用CSRF保护
    },
  },
} as MidwayConfig; 