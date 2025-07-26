import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { User } from '../user/user.entity';
import { UserAddress } from '../address/user_address.entity';
import { OrderItem } from './order-item.entity';
import { UserCoupon } from '../coupon/user-coupon.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ length: 20, default: 'pending' })
  status: string; // pending/paid/shipped/completed

  @Column({ length: 20, default: 'balance' })
  pay_method: string; // balance/alipay

  @Column({ type: 'datetime', nullable: true })
  pay_time: Date;

  @Column({ type: 'boolean', default: false })
  cancelled: boolean;

  @Column()
  address_id: number;

  @ManyToOne(() => UserAddress)
  @JoinColumn({ name: 'address_id' })
  address: UserAddress;

  @Column({ length: 64, nullable: true })
  alipay_trade_no?: string;

  @Column({ length: 64, nullable: true })
  out_trade_no?: string; // 支付宝订单号

  @Column({ type: 'int', nullable: true })
  user_coupon_id?: number; // 使用的优惠券ID

  @ManyToOne(() => UserCoupon)
  @JoinColumn({ name: 'user_coupon_id' })
  user_coupon: UserCoupon;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number; // 优惠金额

  @OneToMany(() => OrderItem, item => item.order)
  orderItems: OrderItem[];

  @CreateDateColumn()
  created_at: Date;
} 