import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { NotificationListener } from './notification.listener';
import { User } from '../user/user.entity';
import { Comment } from '../comment/comment.entity';
import { Reply } from '../reply/reply.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, Comment, Reply])],
  providers: [NotificationService, EmailService, NotificationListener],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
