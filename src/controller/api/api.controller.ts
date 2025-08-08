import { Controller, Inject, Get } from '@midwayjs/core';
import { UserService } from '../../service/user/user.service';

@Controller('/api')
export class APIController {
  @Inject()
  userService: UserService;

  @Get('/health')
  async health() {
    return {
      success: true,
      message: 'OK',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'local'
      }
    };
  }

  // @Get('/get_user')
  // async getUser(@Query('id') id: number) {
  //   // 参数校验放在服务层
  //   const user = await this.userService.getUser({ id });
  //   return {
  //     success: true,
  //     message: 'OK',
  //     data: user
  //   };
  // }
}
