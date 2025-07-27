import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reply } from './reply.entity';
import { Comment } from '../comment/comment.entity';
import { Site } from '../site/site.entity';
import { ReplyService } from './reply.service';
import { ReplyController } from './reply.controller';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reply, Comment, Site]), SiteModule],
  controllers: [ReplyController],
  providers: [ReplyService],
  exports: [ReplyService],
})
export class ReplyModule {}
