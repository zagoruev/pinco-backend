import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Site } from '../site/site.entity';
import { User } from './user.entity';

export enum UserSiteRole {
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR',
}

@Entity('user_sites')
export class UserSite {
  @PrimaryColumn({ type: 'int' })
  user_id: number;

  @PrimaryColumn({ type: 'int' })
  site_id: number;

  @Column({ type: 'varchar', length: 13, nullable: true, unique: true })
  invite_code: string | null;

  @Column({
    type: 'enum',
    enum: UserSiteRole,
    array: true,
    default: [],
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
