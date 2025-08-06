import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import { join } from 'path';
import { ReportMiddleware } from './middleware/report.middleware';
import * as crossDomain from '@midwayjs/cross-domain'; // 跨域模块
import * as jwt from '@midwayjs/jwt';
import { AuthMiddleware } from './middleware/auth.middleware';
import * as typeorm from '@midwayjs/typeorm';
import { DefaultErrorFilter } from './filter/default.filter';
import * as swagger from '@midwayjs/swagger';
import * as busboy from '@midwayjs/busboy';
import { Cart } from './entity/pay/cart.entity';
import { Order } from './entity/pay/order.entity';
import { OrderItem } from './entity/pay/order-item.entity';
import { Recharge } from './entity/pay/recharge.entity';
import { BlindBox } from './entity/blindbox/blindbox.entity';
import { BoxItem } from './entity/blindbox/box-item.entity';
import { BlindBoxComment } from './entity/blindbox/blindbox-comment.entity';
import { BlindBoxCommentLike } from './entity/blindbox/blindbox-comment-like.entity';
import { User } from './entity/user/user.entity';
// 玩家秀相关
import { PlayerShow } from './entity/community/player-show.entity';
import { PlayerShowComment } from './entity/community/player-show-comment.entity';
import { PlayerShowLike } from './entity/community/player-show-like.entity';
import { PlayerShowCommentLike } from './entity/community/player-show-comment-like.entity';
import * as staticFile from '@midwayjs/static-file';
import { Coupon } from './entity/coupon/coupon.entity';
import { UserCoupon } from './entity/coupon/user-coupon.entity';
import * as fs from 'fs';
import * as path from 'path';

@Configuration({
  imports: [
    koa,
    typeorm,
    validate,
    swagger,
    crossDomain,
    busboy,
    jwt,
    staticFile, // 新增静态资源模块
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
    this.app.useMiddleware([ReportMiddleware, AuthMiddleware]);
    // 添加全局错误过滤器
    this.app.useFilter([DefaultErrorFilter]);
    // 移除onReady中的fallback中间件
  }

  async onServerReady() {
    // 兜底history fallback，兼容SPA前端路由
    this.app.use(async (ctx, next) => {
      await next();
      if (
        ctx.status === 404 &&
        ctx.method === 'GET' &&
        !ctx.path.startsWith('/api')
      ) {
        ctx.type = 'html';
        ctx.body = fs.readFileSync(path.join(__dirname, '../public/index.html'));
      }
    });
  }
}
// TypeORM实体注册
module.exports.entities = [
  Cart, Order, OrderItem, Recharge,
  BlindBox, BoxItem, BlindBoxComment, BlindBoxCommentLike, User,
  PlayerShow, PlayerShowComment, PlayerShowLike, PlayerShowCommentLike,
  Coupon, UserCoupon
];

// 静态资源配置
module.exports.staticFile = {
  dirs: {
    default: { prefix: '/', dir: 'public' }
  }
};
