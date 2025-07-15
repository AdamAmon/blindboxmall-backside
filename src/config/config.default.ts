import { MidwayConfig } from '@midwayjs/core';
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
        entities: ['**/entity/*.entity{.ts,.js}'],
      }
    },
    // staticFile: {
    //   dirs: {
    //     default: { prefix: '/', dir: 'public' } // 前端构建产物目录
    //   }
    // },
  }
} as MidwayConfig;
