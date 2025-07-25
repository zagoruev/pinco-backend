import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Site } from '../site/site.entity';
import { Reply } from '../reply/reply.entity';
import { CommentView } from './comment-view.entity';

export interface CommentDetails {
  vh: number;
  vw: number;
  vx: number;
  vy: number;
  env: string;
}

export interface CommentReference {
  x: number;
  y: number;
  selector: string;
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 13, unique: true })
  uniqid: string;

  @Column('text')
  message: string;

  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'bigint' })
  site_id: number;

  @Column({ length: 2048 })
  url: string;

  @Column({ type: 'json', nullable: true })
  reference: CommentReference | null;

  @Column({ type: 'json', nullable: true })
  details: CommentDetails | null;

  @Column({ default: false })
  resolved: boolean;

  @Column({ length: 255, nullable: true, type: 'varchar' })
  screenshot: string | null;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => User, user => user.comments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Site, site => site.comments)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @OneToMany(() => Reply, reply => reply.comment)
  replies: Reply[];

  @OneToMany(() => CommentView, view => view.comment)
  views: CommentView[];
}