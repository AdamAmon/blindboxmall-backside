import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { PlayerShowComment } from './player-show-comment.entity';
import { User } from '../user/user.entity';

@Entity('player_show_comment_likes')
export class PlayerShowCommentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  comment_id: number;

  @ManyToOne(() => PlayerShowComment)
  @JoinColumn({ name: 'comment_id' })
  comment: PlayerShowComment;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;
} 