import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Order } from './order.entity';
import { BlindBox } from '../blindbox/blindbox.entity';
import { BoxItem } from '../blindbox/box-item.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column()
  blind_box_id: number;

  @ManyToOne(() => BlindBox)
  @JoinColumn({ name: 'blind_box_id' })
  blindBox: BlindBox;

  @Column({ nullable: true })
  item_id?: number;

  @ManyToOne(() => BoxItem)
  @JoinColumn({ name: 'item_id' })
  item: BoxItem;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'boolean', default: false })
  is_opened: boolean;

  @Column({ type: 'datetime', nullable: true })
  opened_at: Date;

  @CreateDateColumn()
  created_at: Date;
} 