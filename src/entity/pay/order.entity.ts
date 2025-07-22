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

  @OneToMany(() => OrderItem, item => item.order)
  orderItems: OrderItem[];

  @CreateDateColumn()
  created_at: Date;
} 