import { Controller, Get, Post, Body, Query, Inject } from '@midwayjs/core';
import { AddressService } from '../../service/address/address.service';
import {
  CreateAddressDTO,
  UpdateAddressDTO,
  DeleteAddressDTO,
} from '../../dto/address/address.dto';
import { MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Controller('/api/address')
export class AddressController {
  @Inject()
  addressService: AddressService;

  @Post('/create')
  async createAddress(
    @Body() dto: CreateAddressDTO,
    @Query('userId') userId: number,
    ctx: Context
  ) {
    try {
      let realUserId = userId;
      if ((!realUserId || isNaN(realUserId)) && ((dto as unknown as Record<string, unknown>).user_id)) {
        realUserId = (dto as unknown as Record<string, unknown>).user_id as number;
        delete (dto as unknown as Record<string, unknown>).user_id; // 移除 user_id，避免DTO校验422
      }
      if ((!realUserId || isNaN(realUserId)) && ctx.user && ctx.user.id) {
        realUserId = ctx.user.id;
      }
      if (!realUserId || isNaN(realUserId)) {
        ctx.status = 400;
        return { success: false, message: '缺少或非法用户ID', data: null };
      }
      const address = await this.addressService.createAddress(realUserId, dto);
      return { success: true, data: address };
    } catch (error) {
      ctx.status = 500;
      return { success: false, message: error.message, data: null };
    }
  }

  @Post('/update')
  async updateAddress(
    @Body() dto: UpdateAddressDTO,
    @Query('userId') userId: number,
    ctx: Context
  ) {
    try {
      let realUserId = userId;
      if ((!realUserId || isNaN(realUserId)) && ((dto as unknown as Record<string, unknown>).user_id)) {
        realUserId = (dto as unknown as Record<string, unknown>).user_id as number;
      }
      if ((!realUserId || isNaN(realUserId)) && ctx.user && ctx.user.id) {
        realUserId = ctx.user.id;
      }
      if (!realUserId || isNaN(realUserId)) {
        ctx.status = 400;
        return { success: false, message: '缺少或非法用户ID', data: null };
      }
      const address = await this.addressService.updateAddress(realUserId, dto);
      return { success: true, data: address };
    } catch (error) {
      if (error.status === 404 || error.message === '地址不存在') {
        ctx.status = 404;
        return { success: false, message: error.message, data: null };
      }
      ctx.status = 500;
      return { success: false, message: error.message, data: null };
    }
  }

  @Post('/delete')
  async deleteAddress(
    @Body() dto: DeleteAddressDTO,
    @Query('userId') userId: number,
    ctx: Context
  ) {
    try {
      let realUserId = userId;
      if ((!realUserId || isNaN(realUserId)) && ((dto as unknown as Record<string, unknown>).user_id)) {
        realUserId = (dto as unknown as Record<string, unknown>).user_id as number;
      }
      if ((!realUserId || isNaN(realUserId)) && ctx.user && ctx.user.id) {
        realUserId = ctx.user.id;
      }
      if (!realUserId || isNaN(realUserId)) {
        ctx.status = 400;
        return { success: false, message: '缺少或非法用户ID', data: null };
      }
      const result = await this.addressService.deleteAddress(realUserId, dto.id);
      if (!result) {
        ctx.status = 404;
        return { success: false, message: '地址不存在', data: null };
      }
      return { success: true, data: result };
    } catch (error) {
      if (error.status === 404 || error.message === '地址不存在') {
        ctx.status = 404;
        return { success: false, message: error.message, data: null };
      }
      ctx.status = 500;
      return { success: false, message: error.message, data: null };
    }
  }

  @Get('/list')
  async list(@Query('userId') userId: number, ctx: Context) {
    try {
      let realUserId = userId;
      if ((!realUserId || isNaN(realUserId)) && ctx.user && ctx.user.id) {
        realUserId = ctx.user.id;
      }
      if (!realUserId || isNaN(realUserId)) {
        return { success: false, message: '缺少或非法用户ID', data: null };
      }
      const list = await this.addressService.listAddresses(realUserId);
      return { success: true, data: list };
    } catch (error) {
      return { success: false, message: error.message, data: null };
    }
  }

  @Get('/detail')
  async detail(@Query('id') id: string) {
    if (!id || isNaN(Number(id))) {
      throw new MidwayHttpError('id参数非法', 400);
    }
    try {
      const address = await this.addressService.addressModel.findOne({ where: { id: Number(id) } });
      if (!address) {
        return { success: false, message: '地址不存在', data: null };
      }
      return { success: true, data: address };
    } catch (error) {
      return { success: false, message: error.message, data: null };
    }
  }

  @Post('/set_default')
  async setDefaultAddress(
    @Body() dto: DeleteAddressDTO,
    @Query('userId') userId: number
  ) {
    try {
      const address = await this.addressService.setDefaultAddress(userId, dto.id);
      return { success: true, data: address };
    } catch (error) {
      return { success: false, message: error.message, data: null };
    }
  }
}
