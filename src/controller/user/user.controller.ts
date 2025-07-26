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

  // 新增：我的奖品接口
  @Get('/prizes')
  async getUserPrizes(@Query('user_id') userId: number, @Query('rarity') rarity: string, @Query('keyword') keyword: string, @Query('page') page: string, @Query('limit') limit: string) {
    return await this.userService.getUserPrizes({
      userId: Number(userId),
      rarity: rarity ? Number(rarity) : undefined,
      keyword,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10
    });
  }
}
