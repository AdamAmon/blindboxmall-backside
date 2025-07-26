import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Coupon } from './coupon.entity';

@Entity('user_coupons')
export class UserCoupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  coupon_id: number;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ type: 'tinyint', default: 0, comment: '0未使用 1已使用 2已过期' })
  status: number;

  @Column({ type: 'datetime', nullable: true })
  used_at: Date;

  @Column({ type: 'datetime', nullable: true })
  expired_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 