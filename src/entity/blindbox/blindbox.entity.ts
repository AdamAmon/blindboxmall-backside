import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BoxItem } from './box-item.entity';
import { User } from '../user/user.entity';

@Entity('blind_boxes')
export class BlindBox {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 255 })
  cover_image: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'tinyint', default: 1, comment: '1上架/0下架' })
  status: number;

  @Column({ type: 'int', default: 0 })
  comment_count: number;

  @Column({ type: 'int', comment: '创建者ID' })
  seller_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联关系 - 使用字符串引用避免循环依赖
  @OneToMany('BoxItem', 'blindBox')
  boxItems: BoxItem[];

  @ManyToOne('User', 'blindBoxes')
  @JoinColumn({ name: 'seller_id' })
  seller: User;
} 