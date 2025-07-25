import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserSite } from './user-site.entity';
import { Comment } from '../comment/comment.entity';
import { Reply } from '../reply/reply.entity';
import { CommentView } from '../comment/comment-view.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  SITE_OWNER = 'SITE_OWNER',
  COMMENTER = 'COMMENTER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 7 })
  color: string;

  @Column({ length: 255, unique: true })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ default: true })
  active: boolean;

  @Column({
    type: 'simple-array',
    default: '',
  })
  roles: UserRole[];

  @Column({ length: 255, nullable: true, type: 'varchar' })
  secret_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  secret_expires: Date | null;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @OneToMany(() => UserSite, userSite => userSite.user)
  userSites: UserSite[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];

  @OneToMany(() => Reply, reply => reply.user)
  replies: Reply[];

  @OneToMany(() => CommentView, view => view.user)
  commentViews: CommentView[];
}