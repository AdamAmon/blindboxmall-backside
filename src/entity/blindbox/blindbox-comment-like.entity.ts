import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { BlindBoxComment } from './blindbox-comment.entity';
import { User } from '../user/user.entity';

@Entity('blindbox_comment_likes')
export class BlindBoxCommentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  comment_id: number;

  @ManyToOne(() => BlindBoxComment)
  @JoinColumn({ name: 'comment_id' })
  comment: BlindBoxComment;

  @CreateDateColumn()
  created_at: Date;
} 