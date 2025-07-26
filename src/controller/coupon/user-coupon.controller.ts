import { Controller, Post, Get, Body, Query } from '@midwayjs/core';
import { Inject } from '@midwayjs/core';
import { UserCouponService } from '../../service/coupon/user-coupon.service';
import { ReceiveCouponDTO, UseCouponDTO } from '../../dto/coupon/user-coupon.dto';

@Controller('/api/user-coupon')
export class UserCouponController {
  @Inject()
  userCouponService: UserCouponService;

  @Post('/receive')
  async receive(@Body() dto: ReceiveCouponDTO, @Query('user_id') userId: number) {
    return await this.userCouponService.receiveCoupon(userId, dto.coupon_id);
  }

  @Get('/list')
  async list(@Query('user_id') userId: number) {
    return await this.userCouponService.listUserCoupons(userId);
  }

  @Get('/available')
  async getAvailable(@Query('user_id') userId: number) {
    return await this.userCouponService.getAvailableCoupons(userId);
  }

  @Post('/use')
  async use(@Body() dto: UseCouponDTO) {
    return await this.userCouponService.useCoupon(dto.user_coupon_id);
  }

  // 手动清理过期优惠券（管理员接口）
  @Post('/clean-expired')
  async cleanExpired() {
    const cleanedCount = await this.userCouponService.cleanExpiredUserCoupons();
    return {
      success: true,
      message: `成功清理了 ${cleanedCount} 张过期优惠券`,
      cleanedCount
    };
  }

  // 获取过期优惠券统计信息（管理员接口）
  @Get('/stats')
  async getStats() {
    const stats = await this.userCouponService.getExpiredCouponsStats();
    return {
      success: true,
      data: stats
    };
  }
} 