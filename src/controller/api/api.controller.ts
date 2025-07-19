import { Controller, Inject } from '@midwayjs/core';
import { UserService } from '../../service/user/user.service';

@Controller('/api')
export class APIController {
  @Inject()
  userService: UserService;

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
