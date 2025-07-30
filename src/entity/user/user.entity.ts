import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BlindBox } from '../blindbox/blindbox.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 100 })
  password: string;

  @Column({ length: 50 })
  nickname: string;

  @Column({ length: 255, nullable: true })
  avatar?: string;

  @Column({ length: 20, default: 'customer' })
  role: string;

  @Column({ length: 100, nullable: true })
  email?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'int', nullable: true })
  default_address_id?: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联关系 - 使用字符串引用避免循环依赖
  @OneToMany('BlindBox', 'seller')
  blindBoxes: BlindBox[];

  @OneToMany('BlindBoxComment', 'user')
  blindBoxComments: unknown[];

  @OneToMany('BlindBoxCommentLike', 'user')
  blindBoxCommentLikes: unknown[];
}
