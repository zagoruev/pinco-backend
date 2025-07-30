import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { UserSite } from './user-site.entity';
import { Comment } from '../comment/comment.entity';
import { Reply } from '../reply/reply.entity';
import { CommentView } from '../comment/comment-view.entity';

export enum UserRole {
  ROOT = 'ROOT',
  ADMIN = 'ADMIN',
}

export const USER_COLORS = [
  '#4C53F1',
  '#119AFA',
  '#EDAB00',
  '#D64D4D',
  '#48B836',
  '#B865DF',
  '#ED741C',
  '#00A0D2',
  '#E04DAE',
  '#148F63',
];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  name: string;

  @Expose()
  get color(): string {
    return USER_COLORS[
      Math.abs(
        this.email
          .split('')
          .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0),
      ) % 10
    ];
  }

  @Column({ length: 255, unique: true })
  username: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ default: true })
  active: boolean;

  @Expose({ groups: ['backoffice'] })
  @Column({
    type: 'simple-array',
    default: '',
  })
  roles: UserRole[];

  @Expose({ groups: ['backoffice'] })
  @CreateDateColumn()
  created: Date;

  @Expose({ groups: ['backoffice'] })
  @UpdateDateColumn()
  updated: Date;

  @OneToMany(() => UserSite, (userSite) => userSite.user)
  sites: UserSite[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Reply, (reply) => reply.user)
  replies: Reply[];

  @OneToMany(() => CommentView, (view) => view.user)
  commentViews: CommentView[];
}
