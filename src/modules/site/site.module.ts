import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';
import { Site } from './site.entity';
import { User } from '../user/user.entity';
import { UserSite } from '../user/user-site.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Site, User, UserSite])],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
