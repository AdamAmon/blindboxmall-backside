import { Provide } from '@midwayjs/core';
import { Repository } from 'typeorm';
import { Coupon } from '../../entity/coupon/coupon.entity';
import { InjectEntityModel } from '@midwayjs/typeorm';

@Provide()
export class CouponService {
  @InjectEntityModel(Coupon)
  couponRepo: Repository<Coupon>;

  constructor() {
    // 只在非测试环境中启动定时任务
    if (process.env.NODE_ENV !== 'unittest') {
      this.startAutoOfflineTask();
    }
  }

  private startAutoOfflineTask() {
    setInterval(() => this.autoOfflineExpiredCoupons(), 60 * 60 * 1000);
    setTimeout(() => this.autoOfflineExpiredCoupons(), 5000);
  }

  async autoOfflineExpiredCoupons() {
    const now = new Date();
    await this.couponRepo
      .createQueryBuilder()
      .update()
      .set({ status: 0 })
      .where('end_time < :now', { now })
      .andWhere('status = :status', { status: 1 })
      .execute();
  }

  // 创建优惠券
  async createCoupon(data) {
    return await this.couponRepo.save(data);
  }

  // 查询优惠券列表（分页+有效/失效筛选）
  async listCoupons(page = 1, pageSize = 10, type = 'valid') {
    const now = new Date();
    const qb = this.couponRepo.createQueryBuilder('coupon');
    if (type === 'valid') {
      qb.where('coupon.status = 1').andWhere('coupon.end_time >= :now', { now });
    } else {
      qb.where('coupon.status = 0').orWhere('coupon.end_time < :now', { now });
    }
    qb.orderBy('coupon.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, pageSize };
  }

  // 更新优惠券
  async updateCoupon(id, data) {
    return await this.couponRepo.update(id, data);
  }

  // 删除优惠券
  async deleteCoupon(id) {
    return await this.couponRepo.delete(id);
  }
} 