//:src/entity/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
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
}
