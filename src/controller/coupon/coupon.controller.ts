import { Controller, Post, Get, Put, Body, Query, Del } from '@midwayjs/core';
import { Inject } from '@midwayjs/core';
import { CouponService } from '../../service/coupon/coupon.service';
import { CreateCouponDTO, UpdateCouponDTO } from '../../dto/coupon/coupon.dto';

@Controller('/api/coupon')
export class CouponController {
  @Inject()
  couponService: CouponService;

  @Post('/')
  async create(@Body() dto: CreateCouponDTO) {
    try {
      return await this.couponService.createCoupon(dto);
    } catch (error) {
      throw error;
    }
  }

  @Get('/')
  async list(@Query('page') page: number = 1, @Query('pageSize') pageSize: number = 10, @Query('type') type: 'valid' | 'invalid' = 'valid') {
    try {
      return await this.couponService.listCoupons(page, pageSize, type);
    } catch (error) {
      throw error;
    }
  }

  @Put('/')
  async update(@Body() dto: UpdateCouponDTO) {
    try {
      return await this.couponService.updateCoupon(dto.id, dto);
    } catch (error) {
      throw error;
    }
  }

  @Del('/')
  async delete(@Query('id') id: number) {
    try {
      return await this.couponService.deleteCoupon(id);
    } catch (error) {
      throw error;
    }
  }
} 