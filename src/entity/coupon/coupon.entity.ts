import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'tinyint', comment: '1满减 2折扣' })
  type: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '满减门槛' })
  threshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '满减金额/折扣率' })
  amount: number;

  @Column({ type: 'datetime' })
  start_time: Date;

  @Column({ type: 'datetime' })
  end_time: Date;

  @Column({ type: 'int', default: 0, comment: '总发放数量' })
  total: number;

  @Column({ type: 'int', default: 0, comment: '已领取数量' })
  received: number;

  @Column({ type: 'tinyint', default: 1, comment: '1上架 0下架' })
  status: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 