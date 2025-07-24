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

@Entity('player_show_comments')
export class PlayerShowComment {
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

  @Column({ nullable: true })
  parent_id: number;

  @ManyToOne(() => PlayerShowComment, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: PlayerShowComment;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  created_at: Date;
} 