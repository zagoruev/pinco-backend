import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Site } from '../site/site.entity';

export enum UserSiteRole {
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR',
}

@Entity('user_sites')
export class UserSite {
  @PrimaryColumn({ type: 'bigint' })
  user_id: number;

  @PrimaryColumn({ type: 'bigint' })
  site_id: number;

  @Column({
    type: 'simple-array',
    default: '',
  })
  roles: UserSiteRole[];

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => User, (user) => user.sites)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Site, (site) => site.userSites)
  @JoinColumn({ name: 'site_id' })
  site: Site;
}
