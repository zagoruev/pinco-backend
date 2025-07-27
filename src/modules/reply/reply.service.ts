import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Reply } from './reply.entity';
import { Comment } from '../comment/comment.entity';
import { Site } from '../site/site.entity';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { ReplyResponse } from './dto/reply-response.dto';
import { RequestUser } from '../../types/express';

@Injectable()
export class ReplyService {
  constructor(
    @InjectRepository(Reply)
    private replyRepository: Repository<Reply>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(site: Site): Promise<ReplyResponse[]> {
    const replies = await this.replyRepository
      .createQueryBuilder('reply')
      .leftJoinAndSelect('reply.comment', 'comment')
      .leftJoinAndSelect('reply.user', 'user')
      .where('comment.site_id = :siteId', { siteId: site.id })
      .orderBy('reply.created', 'DESC')
      .getMany();

    return replies.map((reply) => ({
      id: reply.id,
      comment_id: reply.comment_id,
      message: reply.message,
      created: reply.created.toISOString(),
      updated: reply.updated.toISOString(),
      user_id: reply.user_id,
    }));
  }

  async create(
    createDto: CreateReplyDto,
    site: Site,
    currentUser: RequestUser,
  ): Promise<ReplyResponse> {
    // Validate comment exists and belongs to the site
    const comment = await this.commentRepository.findOne({
      where: { id: createDto.comment_id, site_id: site.id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(
        `Comment with ID ${createDto.comment_id} not found`,
      );
    }

    // Create reply
    const reply = this.replyRepository.create({
      comment_id: createDto.comment_id,
      user_id: currentUser.sub,
      message: createDto.message,
    });

    const savedReply = await this.replyRepository.save(reply);

    // Load relations for response
    const fullReply = await this.replyRepository.findOne({
      where: { id: savedReply.id },
      relations: ['user', 'comment'],
    });

    if (!fullReply) {
      throw new Error('Failed to load created reply');
    }

    // Emit event for notifications
    this.eventEmitter.emit('reply.created', {
      reply: fullReply,
      comment,
      site,
    });

    return {
      id: fullReply.id,
      comment_id: fullReply.comment_id,
      message: fullReply.message,
      created: fullReply.created.toISOString(),
      updated: fullReply.updated.toISOString(),
      user_id: fullReply.user_id,
    };
  }

  async update(
    id: number,
    updateDto: UpdateReplyDto,
    site: Site,
    currentUser: RequestUser,
  ): Promise<ReplyResponse> {
    const reply = await this.replyRepository
      .createQueryBuilder('reply')
      .leftJoinAndSelect('reply.comment', 'comment')
      .leftJoinAndSelect('reply.user', 'user')
      .where('reply.id = :id', { id })
      .andWhere('comment.site_id = :siteId', { siteId: site.id })
      .getOne();

    if (!reply) {
      throw new NotFoundException(`Reply with ID ${id} not found`);
    }

    // Only author can update the reply
    if (reply.user_id !== currentUser.sub) {
      throw new BadRequestException('You can only edit your own replies');
    }

    // Update message if provided
    if (updateDto.message !== undefined) {
      reply.message = updateDto.message;
    }

    const savedReply = await this.replyRepository.save(reply);

    return {
      id: savedReply.id,
      comment_id: savedReply.comment_id,
      message: savedReply.message,
      created: savedReply.created.toISOString(),
      updated: savedReply.updated.toISOString(),
      user_id: savedReply.user_id,
    };
  }
}
