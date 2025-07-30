import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { BlindBox } from './blindbox.entity';
import { User } from '../user/user.entity';

@Entity('blindbox_comments')
export class BlindBoxComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  blind_box_id: number;

  @ManyToOne(() => BlindBox)
  @JoinColumn({ name: 'blind_box_id' })
  blindBox: BlindBox;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  parent_id: number;

  @ManyToOne(() => BlindBoxComment, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: BlindBoxComment;

  @OneToMany(() => BlindBoxComment, comment => comment.parent)
  replies: BlindBoxComment[];

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  like_count: number;

  @CreateDateColumn()
  created_at: Date;
} 