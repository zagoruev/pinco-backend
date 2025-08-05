import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Reply } from '../reply/reply.entity';
import { Site } from '../site/site.entity';
import { User } from '../user/user.entity';
import { CommentView } from './comment-view.entity';

export const COMMENT_PREFIX = 'c-';

export interface CommentDetails {
  vh: number;
  vw: number;
  vx: number;
  vy: number;
  env: string;
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ length: 13, unique: true })
  uniqid: string;

  @Column('text')
  message: string;

  @Column({ type: 'int' })
  user_id: number;

  @Exclude()
  @Column({ type: 'int' })
  site_id: number;

  @Column({ length: 2048 })
  url: string;

  @Column({ type: 'json', nullable: true })
  reference: string | null;

  @Column({ type: 'json', nullable: true })
  details: CommentDetails | null;

  @Column({ default: false })
  resolved: boolean;

  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value.toISOString().slice(0, 19).replace('T', ' '), { groups: ['widget'] })
  created: Date;

  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value.toISOString().slice(0, 19).replace('T', ' '), { groups: ['widget'] })
  updated: Date;

  screenshot: string | null;

  @Expose()
  @Transform(({ value }: { value: Date | null }) => value?.toISOString().slice(0, 19).replace('T', ' ') ?? null, {
    groups: ['widget'],
  })
  get viewed(): Date | null {
    return this.views?.find((view) => view.user_id === this.user_id)?.viewed || null;
  }

  @Exclude()
  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Exclude()
  @ManyToOne(() => Site, (site) => site.comments)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @OneToMany(() => Reply, (reply) => reply.comment)
  replies: Reply[];

  @Exclude()
  @OneToMany(() => CommentView, (view) => view.comment)
  views: CommentView[];
}
