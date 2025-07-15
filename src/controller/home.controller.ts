import { Controller, Get } from '@midwayjs/core';

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
  async home(): Promise<string> {
    return 'Hello Midwayjs!';
  }
}
