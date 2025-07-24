import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { PlayerShow } from './player-show.entity';
import { User } from '../user/user.entity';

@Entity('player_show_likes')
export class PlayerShowLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  show_id: number;

  @ManyToOne(() => PlayerShow)
  @JoinColumn({ name: 'show_id' })
  show: PlayerShow;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;
} 