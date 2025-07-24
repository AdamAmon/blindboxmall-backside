import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../user/user.entity';
import { BoxItem } from '../blindbox/box-item.entity';
import { OrderItem } from '../pay/order-item.entity';

@Entity('player_shows')
export class PlayerShow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  item_id: number;

  @ManyToOne(() => BoxItem)
  @JoinColumn({ name: 'item_id' })
  item: BoxItem;

  @Column()
  order_item_id: number;

  @ManyToOne(() => OrderItem)
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-json', nullable: true })
  images: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 