import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserSite } from './user-site.entity';
import { Site } from '../site/site.entity';
import { SiteModule } from '../site/site.module';
import { UserSiteService } from './user-site.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSite, Site]),
    SiteModule,
    JwtModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserSiteService],
  exports: [UserService, UserSiteService],
})
export class UserModule {}
