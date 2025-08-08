import { Controller, Get } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Controller('/')
export class HomeController {
  // 处理 Chrome DevTools 的特殊请求
  @Get('/.well-known/appspecific/com.chrome.devtools.json')
  async handleDevToolsRequest() {
    return {
      // 返回一个空对象避免警告
      // 或者根据实际需求返回模拟数据
    };
  }
  
  @Get('/')
  async home(ctx: Context): Promise<void> {
    // 直接重定向到登录页面
    ctx.redirect('/login');
  }
}
