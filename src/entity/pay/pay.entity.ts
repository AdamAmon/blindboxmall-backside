import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('recharge')
export class Recharge {
  @PrimaryGeneratedColumn()
  recharge_id: number;

  @Column()
  recharge_user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recharge_user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  recharge_amount: number;

  @Column({ length: 20, default: 'pending' })
  recharge_status: string; // pending, success, failed

  @Column({ length: 64 })
  recharge_out_trade_no: string; // 本地订单号

  @Column({ length: 64, nullable: true })
  recharge_alipay_trade_no: string; // 支付宝订单号

  @Column({ type: 'datetime', nullable: true })
  recharge_pay_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 