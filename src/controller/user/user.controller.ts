import { Controller, Get, Post, Body, Query, Inject } from '@midwayjs/core';
import { UserService } from '../../service/user/user.service';
import { UpdateUserDTO } from '../../dto/user/user.dto';

@Controller('/api/user')
export class UserController {
  @Inject()
  userService: UserService;

  @Get('/get')
  async getUser(@Query('id') id: number) {
    const user = await this.userService.getUser({ id });
    return { success: true, data: user };
  }

  @Post('/update')
  async updateUser(@Body() dto: UpdateUserDTO) {
    const user = await this.userService.updateUser(dto);
    return { success: true, data: user };
  }
}
