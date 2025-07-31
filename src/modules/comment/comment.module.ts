import { memoryStorage } from 'multer';

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reply } from '../reply/reply.entity';
import { ReplyModule } from '../reply/reply.module';
import { ScreenshotModule } from '../screenshot/screenshot.module';
import { Site } from '../site/site.entity';
import { SiteModule } from '../site/site.module';
import { CommentView } from './comment-view.entity';
import { CommentController } from './comment.controller';
import { Comment } from './comment.entity';
import { CommentService } from './comment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentView, Reply, Site]),
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    ScreenshotModule,
    SiteModule,
    ReplyModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
