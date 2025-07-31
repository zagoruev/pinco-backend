import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from '../comment/comment.entity';
import { Reply } from '../reply/reply.entity';
import { User } from '../user/user.entity';
import { EmailService } from './email.service';
import { NotificationListener } from './notification.listener';
import { NotificationService } from './notification.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, Comment, Reply])],
  providers: [NotificationService, EmailService, NotificationListener],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
