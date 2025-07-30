import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Site } from '../site/site.entity';
import { Reply } from '../reply/reply.entity';
import { CommentView } from './comment-view.entity';
import { Exclude, Expose } from 'class-transformer';

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
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  screenshot: string | null;

  @Expose()
  get viewed(): Date | null {
    return (
      this.views?.find((view) => view.user_id === this.user_id)?.viewed || null
    );
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
