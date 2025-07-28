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
import { Reply } from '../reply/reply.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponse } from './dto/comment-response.dto';
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
    @InjectRepository(Reply)
    private replyRepository: Repository<Reply>,
    private replyService: ReplyService,
    private screenshotService: ScreenshotService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    site: Site,
    currentUser: RequestUser,
  ): Promise<CommentResponse[]> {
    const comments = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'reply')
      .leftJoinAndSelect('reply.user', 'replyUser')
      .leftJoinAndSelect('comment.views', 'view', 'view.user_id = :userId', {
        userId: currentUser.sub,
      })
      .where('comment.site_id = :siteId', { siteId: site.id })
      .orderBy('comment.created', 'DESC')
      .addOrderBy('reply.created', 'ASC')
      .getMany();

    // Format response according to frontend contract
    return comments.map((comment) => {
      // Get the viewed timestamp for current user
      const viewRecord = comment.views?.find(
        (v) => v.user_id === currentUser.sub,
      );

      return {
        ...comment,
        viewed: viewRecord?.viewed || null,
        screenshot: comment.screenshot
          ? this.screenshotService.getUrl(comment.screenshot)
          : undefined,
        replies: comment.replies.map((reply) => ({
          ...reply,
          formatted_message: reply.message, // Will be handled by notification module later
        })),
      };
    });
  }

  async listComments(
    currentUser: RequestUser,
    siteId?: number,
  ): Promise<CommentResponse[]> {
    const comments = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'reply')
      .leftJoinAndSelect('reply.user', 'replyUser')
      .where('comment.site_id = :siteId', { siteId })
      .orderBy('comment.created', 'DESC')
      .addOrderBy('reply.created', 'ASC')
      .getMany();

    return comments.map((comment) => {
      return {
        ...comment,
        viewed: null,
        screenshot: comment.screenshot
          ? this.screenshotService.getUrl(comment.screenshot)
          : undefined,
        replies: comment.replies.map((reply) => ({
          ...reply,
          formatted_message: reply.message,
        })),
      };
    });
  }

  async create(
    createDto: CreateCommentDto,
    site: Site,
    currentUser: RequestUser,
  ): Promise<CommentResponse> {
    const uniqid = generateUniqid();

    // Handle screenshot
    let screenshotFilename: string | null = null;
    if (createDto.screenshot) {
      screenshotFilename = `${uniqid}.jpg`;
      await this.screenshotService.save(
        createDto.screenshot,
        screenshotFilename,
      );
    }

    // Create comment
    const comment = this.commentRepository.create({
      uniqid,
      message: createDto.message,
      user_id: currentUser.sub,
      site_id: site.id,
      url: createDto.url,
      details: createDto.details || null,
      reference: createDto.reference || null,
      screenshot: screenshotFilename,
      resolved: false,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Create view record
    const viewed = new Date();
    await this.commentViewRepository.save({
      comment_id: savedComment.id,
      user_id: currentUser.sub,
      viewed,
    });

    // Load relations for response
    const fullComment = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user', 'replies', 'replies.user'],
    });

    if (!fullComment) {
      throw new Error('Failed to load created comment');
    }

    // Emit event for notifications
    this.eventEmitter.emit('comment.created', {
      comment: fullComment,
      site,
    });

    // Format response
    return {
      ...fullComment,
      viewed,
      screenshot: fullComment.screenshot
        ? this.screenshotService.getUrl(fullComment.screenshot)
        : undefined,
      replies: [],
    };
  }

  async update(
    id: number,
    updateDto: UpdateCommentDto,
    site: Site,
    currentUser: RequestUser,
  ): Promise<CommentResponse> {
    const comment = await this.commentRepository.findOne({
      where: { id, site_id: site.id },
      relations: ['user', 'replies', 'replies.user', 'views'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Only author can update the comment
    if (comment.user_id !== currentUser.sub) {
      throw new BadRequestException('You can only edit your own comments');
    }

    // Handle screenshot update
    if (updateDto.screenshot) {
      // Delete old screenshot if exists
      if (comment.screenshot) {
        await this.screenshotService.delete(comment.screenshot);
      }

      const screenshotFilename = `${comment.uniqid}.jpg`;
      await this.screenshotService.save(
        updateDto.screenshot,
        screenshotFilename,
      );
      comment.screenshot = screenshotFilename;
    }

    // Update fields
    if (updateDto.message !== undefined) comment.message = updateDto.message;
    if (updateDto.details !== undefined) comment.details = updateDto.details;
    if (updateDto.reference !== undefined)
      comment.reference = updateDto.reference;
    if (updateDto.url !== undefined) comment.url = updateDto.url;
    if (updateDto.resolved !== undefined) comment.resolved = updateDto.resolved;

    const viewRecord = comment.views.find(
      (view) => view.user_id === currentUser.sub,
    );

    const savedComment = await this.commentRepository.save(comment);

    if (comment.resolved && updateDto.resolved) {
      await this.replyService.addResolveReply(comment, currentUser.sub);
    }

    // Format response
    return {
      ...savedComment,
      viewed: viewRecord?.viewed || null,
      screenshot: savedComment.screenshot
        ? this.screenshotService.getUrl(savedComment.screenshot)
        : undefined,
    };
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
      (view) => view.user_id === currentUser.sub,
    );

    if (isAlreadyViewed) {
      return { viewed: isAlreadyViewed.viewed, user_id: currentUser.sub };
    }

    const viewRecord = await this.commentViewRepository.save({
      comment_id: id,
      user_id: currentUser.sub,
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
      user_id: currentUser.sub,
    });

    return {
      viewed: null,
      user_id: currentUser.sub,
    };
  }

  async markAllAsViewed(site: Site, currentUser: RequestUser): Promise<void> {
    // Get all comments for the site
    const comments = await this.commentRepository.find({
      where: { site_id: site.id },
    });

    // Create view records for all comments
    const viewRecords = comments.map((comment) => ({
      comment_id: comment.id,
      user_id: currentUser.sub,
      viewed: new Date(),
    }));

    if (viewRecords.length > 0) {
      await this.commentViewRepository.save(viewRecords);
    }
  }
}
