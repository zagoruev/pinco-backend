import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Reply } from './reply.entity';
import { Comment } from '../comment/comment.entity';
import { Site } from '../site/site.entity';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { RequestUser } from '../../types/express';
import { isResolveAdded } from './reply.utils';

@Injectable()
export class ReplyService {
  constructor(
    @InjectRepository(Reply)
    private replyRepository: Repository<Reply>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(site: Site): Promise<Reply[]> {
    return await this.replyRepository
      .createQueryBuilder('reply')
      .leftJoinAndSelect('reply.comment', 'comment')
      .leftJoinAndSelect('reply.user', 'user')
      .where('comment.site_id = :siteId', { siteId: site.id })
      .orderBy('reply.created', 'DESC')
      .getMany();
  }

  async create(
    createDto: CreateReplyDto,
    site: Site,
    currentUser: RequestUser,
  ): Promise<Reply> {
    const comment = await this.commentRepository.findOneOrFail({
      where: { id: createDto.comment_id, site_id: site.id },
      relations: ['user'],
    });

    const newReply = this.replyRepository.create({
      comment_id: createDto.comment_id,
      user_id: currentUser.id,
      message: createDto.message,
    });

    if (isResolveAdded(newReply.message) && !comment.resolved) {
      comment.resolved = true;
      await this.commentRepository.save(comment);
    }

    const savedReply = await this.replyRepository.save(newReply);

    const reply = await this.replyRepository.findOneOrFail({
      where: { id: savedReply.id },
      relations: ['user', 'comment'],
    });

    this.eventEmitter.emit('reply.created', {
      reply,
      comment,
      site,
    });

    return reply;
  }

  async addResolveReply(comment: Comment, user_id: number): Promise<Reply> {
    const reply = this.replyRepository.create({
      comment_id: comment.id,
      user_id,
      message: '{{{resolved}}}',
    });

    return this.replyRepository.save(reply);
  }

  async update(
    id: number,
    updateDto: UpdateReplyDto,
    site: Site,
    currentUser: RequestUser,
  ): Promise<Reply> {
    const reply = await this.replyRepository.findOneOrFail({
      where: { id, comment: { site_id: site.id } },
    });

    if (reply.user_id !== currentUser.id) {
      throw new BadRequestException('You can only edit your own replies');
    }

    if (updateDto.message !== undefined) {
      reply.message = updateDto.message;
    }

    const savedReply = await this.replyRepository.save(reply);

    return savedReply;
  }
}
