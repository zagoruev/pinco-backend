import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Site } from '../site/site.entity';
import { SiteModule } from '../site/site.module';
import { UserSite } from './user-site.entity';
import { UserSiteService } from './user-site.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSite, Site]), SiteModule, JwtModule],
  controllers: [UserController],
  providers: [UserService, UserSiteService],
  exports: [UserService, UserSiteService],
})
export class UserModule {}
