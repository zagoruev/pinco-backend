import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { customAlphabet } from 'nanoid';
import { Comment } from './comment.entity';
import { CommentView } from './comment-view.entity';
import { Site } from '../site/site.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ScreenshotService } from '../screenshot/screenshot.service';
import { RequestUser } from '../../types/express';
import { ReplyService } from '../reply/reply.service';

const generateUniqid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  13,
);

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(CommentView)
    private commentViewRepository: Repository<CommentView>,
    private replyService: ReplyService,
    private screenshotService: ScreenshotService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(site: Site, currentUser: RequestUser): Promise<Comment[]> {
    const comments = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'reply')
      .leftJoinAndSelect('reply.user', 'replyUser')
      .leftJoinAndSelect('comment.views', 'view', 'view.user_id = :userId', {
        userId: currentUser.id,
      })
      .where('comment.site_id = :siteId', { siteId: site.id })
      .orderBy('comment.created', 'DESC')
      .addOrderBy('reply.created', 'ASC')
      .getMany();

    return comments.map((comment) => {
      comment.screenshot = this.screenshotService.getUrl(comment);
      return comment;
    });
  }

  async create(
    createDto: CreateCommentDto,
    site: Site,
    currentUser: RequestUser,
  ): Promise<Comment> {
    const uniqid = generateUniqid();

    const comment = this.commentRepository.create({
      uniqid,
      message: createDto.message,
      user_id: currentUser.id,
      site_id: site.id,
      url: createDto.url,
      details: createDto.details || null,
      reference: createDto.reference || null,
      resolved: false,
    });

    if (createDto.screenshot) {
      await this.screenshotService.save(createDto.screenshot, comment);
    }

    const savedComment = await this.commentRepository.save(comment);

    const viewed = new Date();
    await this.commentViewRepository.save({
      comment_id: savedComment.id,
      user_id: currentUser.id,
      viewed,
    });

    const fullComment = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user', 'replies', 'replies.user'],
    });

    if (!fullComment) {
      throw new Error('Failed to load created comment');
    }

    this.eventEmitter.emit('comment.created', {
      comment: fullComment,
      site,
    });

    return {
      ...fullComment,
      viewed,
      screenshot: this.screenshotService.getUrl(fullComment),
      replies: [],
    };
  }

  async update(
    id: number,
    updateDto: UpdateCommentDto,
    site: Site,
    currentUser: RequestUser,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id, site_id: site.id },
      relations: ['user', 'replies', 'replies.user', 'views'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.user_id !== currentUser.id) {
      throw new BadRequestException('You can only edit your own comments');
    }

    if (updateDto.message !== undefined) comment.message = updateDto.message;
    if (updateDto.details !== undefined) comment.details = updateDto.details;
    if (updateDto.reference !== undefined)
      comment.reference = updateDto.reference;
    if (updateDto.url !== undefined) comment.url = updateDto.url;
    if (updateDto.resolved !== undefined) comment.resolved = updateDto.resolved;

    const savedComment = await this.commentRepository.save(comment);

    if (comment.resolved && updateDto.resolved) {
      await this.replyService.addResolveReply(comment, currentUser.id);
    }

    savedComment.screenshot = this.screenshotService.getUrl(savedComment);

    return savedComment;
  }

  async markAsViewed(
    id: number,
    site: Site,
    currentUser: RequestUser,
  ): Promise<{ viewed: Date; user_id: number }> {
    const comment = await this.commentRepository.findOne({
      where: { id, site_id: site.id },
      relations: ['views'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    const isAlreadyViewed = comment.views.find(
      (view) => view.user_id === currentUser.id,
    );

    if (isAlreadyViewed) {
      return { viewed: isAlreadyViewed.viewed, user_id: currentUser.id };
    }

    const viewRecord = await this.commentViewRepository.save({
      comment_id: id,
      user_id: currentUser.id,
      viewed: new Date(),
    });

    return {
      viewed: viewRecord.viewed,
      user_id: viewRecord.user_id,
    };
  }

  async markAsUnviewed(
    id: number,
    site: Site,
    currentUser: RequestUser,
  ): Promise<{ viewed: null; user_id: number }> {
    const comment = await this.commentRepository.findOne({
      where: { id, site_id: site.id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    await this.commentViewRepository.delete({
      comment_id: id,
      user_id: currentUser.id,
    });

    return {
      viewed: null,
      user_id: currentUser.id,
    };
  }

  async markAllAsViewed(site: Site, currentUser: RequestUser): Promise<void> {
    const comments = await this.commentRepository.find({
      where: { site_id: site.id },
    });

    const viewRecords = comments.map((comment) => ({
      comment_id: comment.id,
      user_id: currentUser.id,
      viewed: new Date(),
    }));

    if (viewRecords.length > 0) {
      await this.commentViewRepository.save(viewRecords);
    }
  }
}
