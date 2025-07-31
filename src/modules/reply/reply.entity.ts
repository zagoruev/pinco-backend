import { Exclude, Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Comment } from '../comment/comment.entity';
import { User } from '../user/user.entity';

@Entity('replies')
export class Reply {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int' })
  comment_id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column('text')
  message: string;

  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value.toISOString().slice(0, 19).replace('T', ' '), { groups: ['widget'] })
  created: Date;

  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value.toISOString().slice(0, 19).replace('T', ' '), { groups: ['widget'] })
  updated: Date;

  @Exclude()
  @ManyToOne(() => Comment, (comment) => comment.replies)
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Exclude()
  @ManyToOne(() => User, (user) => user.replies)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
