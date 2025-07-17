import { Controller, Get, Query, Inject, Body, Post } from '@midwayjs/core';
import { UserService } from '../service/user.service';
import { CreateAddressDTO, UpdateAddressDTO, DeleteAddressDTO, UpdateUserDTO } from '../dto/user.dto';

@Controller('/api')
export class APIController {
  @Inject()
  userService: UserService;

  @Get('/get_user')
  async getUser(@Query('id') id: number) {
    // 参数校验放在服务层
    const user = await this.userService.getUser({ id });
    return {
      success: true,
      message: 'OK',
      data: user
    };
  }

  @Post('/address/create')
  async createAddress(@Body() dto: CreateAddressDTO, @Query('userId') userId: number) {
    const address = await this.userService.createAddress(userId, dto);
    return { success: true, data: address };
  }

  @Post('/address/update')
  async updateAddress(@Body() dto: UpdateAddressDTO, @Query('userId') userId: number) {
    const address = await this.userService.updateAddress(userId, dto);
    return { success: true, data: address };
  }

  @Post('/address/delete')
  async deleteAddress(@Body() dto: DeleteAddressDTO, @Query('userId') userId: number) {
    const result = await this.userService.deleteAddress(userId, dto.id);
    return { success: true, data: result };
  }

  @Get('/address/list')
  async listAddresses(@Query('userId') userId: number) {
    const list = await this.userService.listAddresses(userId);
    return { success: true, data: list };
  }

  @Post('/address/set_default')
  async setDefaultAddress(@Body() dto: DeleteAddressDTO, @Query('userId') userId: number) {
    const address = await this.userService.setDefaultAddress(userId, dto.id);
    return { success: true, data: address };
  }

  @Post('/user/update')
  async updateUser(@Body() dto: UpdateUserDTO) {
    const user = await this.userService.updateUser(dto);
    return { success: true, data: user };
  }
}
