import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from '../comment/comment.entity';
import { Site } from '../site/site.entity';
import { SiteModule } from '../site/site.module';
import { ReplyController } from './reply.controller';
import { Reply } from './reply.entity';
import { ReplyService } from './reply.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reply, Comment, Site]), SiteModule],
  controllers: [ReplyController],
  providers: [ReplyService],
  exports: [ReplyService],
})
export class ReplyModule {}
