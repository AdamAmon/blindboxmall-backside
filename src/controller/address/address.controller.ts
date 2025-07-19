import { Controller, Get, Post, Body, Query, Inject } from '@midwayjs/core';
import { AddressService } from '../../service/address/address.service';
import {
  CreateAddressDTO,
  UpdateAddressDTO,
  DeleteAddressDTO,
} from '../../dto/address/address.dto';

@Controller('/api/address')
export class AddressController {
  @Inject()
  addressService: AddressService;

  @Post('/create')
  async createAddress(
    @Body() dto: CreateAddressDTO,
    @Query('userId') userId: number
  ) {
    const address = await this.addressService.createAddress(userId, dto);
    return { success: true, data: address };
  }

  @Post('/update')
  async updateAddress(
    @Body() dto: UpdateAddressDTO,
    @Query('userId') userId: number
  ) {
    const address = await this.addressService.updateAddress(userId, dto);
    return { success: true, data: address };
  }

  @Post('/delete')
  async deleteAddress(
    @Body() dto: DeleteAddressDTO,
    @Query('userId') userId: number
  ) {
    const result = await this.addressService.deleteAddress(userId, dto.id);
    return { success: true, data: result };
  }

  @Get('/list')
  async listAddresses(@Query('userId') userId: number) {
    const list = await this.addressService.listAddresses(userId);
    return { success: true, data: list };
  }

  @Post('/set_default')
  async setDefaultAddress(
    @Body() dto: DeleteAddressDTO,
    @Query('userId') userId: number
  ) {
    const address = await this.addressService.setDefaultAddress(userId, dto.id);
    return { success: true, data: address };
  }
}
