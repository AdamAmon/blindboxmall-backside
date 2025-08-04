import { Provide } from '@midwayjs/core';
import { Repository } from 'typeorm';
import { UserCoupon } from '../../entity/coupon/user-coupon.entity';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Coupon } from '../../entity/coupon/coupon.entity';

@Provide()
export class UserCouponService {
  @InjectEntityModel(UserCoupon)
  userCouponRepo: Repository<UserCoupon>;
  @InjectEntityModel(Coupon)
  couponRepo: Repository<Coupon>;

  constructor() {
    // 只在非测试环境中启动定时任务
    if (process.env.NODE_ENV !== 'unittest') {
      this.startCleanupTask();
    }
  }

  // 启动定时清理任务
  private startCleanupTask() {
    // 每小时执行一次清理
    setInterval(async () => {
      try {
        const cleanedCount = await this.cleanExpiredUserCoupons();
        if (cleanedCount > 0) {
          console.log(`[${new Date().toISOString()}] 自动清理了 ${cleanedCount} 张过期优惠券`);
        }
      } catch (error) {
        console.error('清理过期优惠券时出错:', error);
      }
    }, 60 * 60 * 1000); // 60分钟

    // 立即执行一次清理
    setTimeout(async () => {
      try {
        const cleanedCount = await this.cleanExpiredUserCoupons();
        if (cleanedCount > 0) {
          console.log(`[${new Date().toISOString()}] 启动时清理了 ${cleanedCount} 张过期优惠券`);
        }
      } catch (error) {
        console.error('启动时清理过期优惠券出错:', error);
      }
    }, 5000); // 5秒后执行
  }

  // 用户领取优惠券
  async receiveCoupon(userId: number, couponId: number) {
    // 只校验有效期
    const coupon = await this.couponRepo.findOne({ where: { id: couponId } });
    if (!coupon) throw new Error('优惠券不存在');
    const now = new Date();
    if (now < coupon.start_time || now > coupon.end_time) {
      throw new Error('优惠券不在有效期内');
    }
    // 允许重复领取
    return await this.userCouponRepo.save({ user_id: userId, coupon_id: couponId });
  }

  // 用户优惠券列表
  async listUserCoupons(userId: number) {
    const now = new Date();
    return await this.userCouponRepo
      .createQueryBuilder('userCoupon')
      .leftJoinAndSelect('userCoupon.coupon', 'coupon')
      .where('userCoupon.user_id = :userId', { userId })
      .andWhere('coupon.end_time >= :now', { now }) // 只返回未过期的优惠券
      .getMany();
  }

  // 使用优惠券
  async useCoupon(userCouponId: number) {
    return await this.userCouponRepo.update(userCouponId, { status: 1, used_at: new Date() });
  }

  // 自动过期处理
  async expireCoupons() {
    const now = new Date();
    // 查找所有未使用但已过期的优惠券
    const expiredCoupons = await this.userCouponRepo
      .createQueryBuilder('userCoupon')
      .leftJoin('userCoupon.coupon', 'coupon')
      .where('userCoupon.status = :status', { status: 0 })
      .andWhere('coupon.end_time < :now', { now })
      .getMany();
    
    // 批量更新为已过期状态
    if (expiredCoupons.length > 0) {
      const ids = expiredCoupons.map(c => c.id);
      await this.userCouponRepo.update(ids, { 
        status: 2, 
        expired_at: now 
      });
    }
    
    return expiredCoupons.length;
  }

  // 获取用户可用优惠券（已过滤过期和已使用的）
  async getAvailableCoupons(userId: number) {
    const now = new Date();
    return await this.userCouponRepo
      .createQueryBuilder('userCoupon')
      .leftJoinAndSelect('userCoupon.coupon', 'coupon')
      .where('userCoupon.user_id = :userId', { userId })
      .andWhere('userCoupon.status = :status', { status: 0 })
      .andWhere('coupon.start_time <= :now', { now })
      .andWhere('coupon.end_time >= :now', { now })
      .getMany();
  }

  // 自动清理所有已过期的用户优惠券
  async cleanExpiredUserCoupons() {
    const now = new Date();
    // 查找所有已过期的用户优惠券
    const expiredUserCoupons = await this.userCouponRepo
      .createQueryBuilder('userCoupon')
      .leftJoinAndSelect('userCoupon.coupon', 'coupon')
      .where('coupon.end_time < :now', { now })
      .andWhere('userCoupon.status = :status', { status: 0 }) // 只处理未使用的优惠券
      .getMany();
    
    // 批量更新为已过期状态，而不是删除
    if (expiredUserCoupons.length > 0) {
      const ids = expiredUserCoupons.map(c => c.id);
      await this.userCouponRepo.update(ids, { 
        status: 2, 
        expired_at: now 
      });
    }
    return expiredUserCoupons.length;
  }

  // 获取过期优惠券统计信息
  async getExpiredCouponsStats() {
    const now = new Date();
    const expiredCount = await this.userCouponRepo
      .createQueryBuilder('userCoupon')
      .leftJoin('userCoupon.coupon', 'coupon')
      .where('coupon.end_time < :now', { now })
      .getCount();
    
    const totalCount = await this.userCouponRepo.count();
    const usedCount = await this.userCouponRepo.count({ where: { status: 1 } });
    const availableCount = await this.userCouponRepo.count({ where: { status: 0 } });
    
    return {
      total: totalCount,
      expired: expiredCount,
      used: usedCount,
      available: availableCount
    };
  }
} 