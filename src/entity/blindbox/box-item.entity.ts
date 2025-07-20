import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BlindBox } from './blindbox.entity';

@Entity('box_items')
export class BoxItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  blind_box_id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255 })
  image: string;

  @Column({ type: 'tinyint', comment: '1普通,2稀有,3隐藏' })
  rarity: number;

  @Column({ type: 'decimal', precision: 4, scale: 3, comment: '抽中概率' })
  probability: number;

  // 关联关系 - 使用字符串引用避免循环依赖
  @ManyToOne('BlindBox', 'boxItems')
  @JoinColumn({ name: 'blind_box_id' })
  blindBox: BlindBox;
} 