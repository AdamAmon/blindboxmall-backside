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
    return await this.couponService.createCoupon(dto);
  }

  @Get('/')
  async list(@Query('page') page: number = 1, @Query('pageSize') pageSize: number = 10, @Query('type') type: 'valid' | 'invalid' = 'valid') {
    return await this.couponService.listCoupons(page, pageSize, type);
  }

  @Put('/')
  async update(@Body() dto: UpdateCouponDTO) {
    return await this.couponService.updateCoupon(dto.id, dto);
  }

  @Del('/')
  async delete(@Query('id') id: number) {
    return await this.couponService.deleteCoupon(id);
  }
} 