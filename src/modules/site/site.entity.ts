import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Comment } from '../comment/comment.entity';
import { UserSite } from '../user/user-site.entity';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  license: string;

  @Column({ length: 255, unique: true })
  domain: string;

  @Column({ length: 255 })
  url: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @OneToMany(() => UserSite, (userSite) => userSite.site)
  userSites: UserSite[];

  @OneToMany(() => Comment, (comment) => comment.site)
  comments: Comment[];
}
