import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import { join } from 'path';
import { ReportMiddleware } from './middleware/report.middleware';
import * as crossDomain from '@midwayjs/cross-domain'; // 跨域模块
import * as busboy from '@midwayjs/busboy';
import * as jwt from '@midwayjs/jwt';
import { AuthMiddleware } from './middleware/auth.middleware';
import * as typeorm from '@midwayjs/typeorm';

@Configuration({
  imports: [
    koa,
    typeorm,
    validate,
    crossDomain,
    busboy,
    jwt,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  async onReady() {
    // 确保中间件正确加载顺序
    this.app.useMiddleware([
      ReportMiddleware,
      AuthMiddleware,
    ]);
  }
}
