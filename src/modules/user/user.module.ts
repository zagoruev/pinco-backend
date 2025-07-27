import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserSite } from './user-site.entity';
import { Site } from '../site/site.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSite, Site])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
