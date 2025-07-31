import { Repository } from 'typeorm';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { RequestUser } from '../../types/express';
import { Comment } from '../comment/comment.entity';
import { Site } from '../site/site.entity';
import { User, UserRole } from '../user/user.entity';
import { Reply } from './reply.entity';
import { ReplyService } from './reply.service';
import * as replyUtils from './reply.utils';

jest.mock('./reply.utils');

describe('ReplyService', () => {
  let service: ReplyService;
  let replyRepository: Repository<Reply>;
  let commentRepository: Repository<Comment>;
  let eventEmitter: EventEmitter2;

  const mockSite: Site = {
    id: 1,
    name: 'Test Site',
    license: 'LICENSE-123',
    url: 'https://test.com',
    domain: 'test.com',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  };

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    get color() {
      return '#4C53F1';
    },
    username: 'testuser',
    password: 'hashed',
    active: true,
    roles: [UserRole.ADMIN],
    created: new Date(),
    updated: new Date(),
    sites: [],
    userSites: [],
    comments: [],
    replies: [],
    commentViews: [],
  } as User;

  const mockComment = {
    id: 1,
    uniqid: 'abc123def4567',
    message: 'Test comment',
    user_id: 1,
    site_id: 1,
    url: 'https://test.com/page',
    details: null,
    reference: null,
    resolved: false,
    screenshot: null,
    created: new Date(),
    updated: new Date(),
    user: mockUser,
    site: mockSite,
    replies: [],
    views: [],
    get viewed() {
      return null;
    },
  } as Comment;

  const mockReply: Reply = {
    id: 1,
    comment_id: 1,
    user_id: 1,
    message: 'Test reply',
    created: new Date(),
    updated: new Date(),
    comment: mockComment,
    user: mockUser,
  };

  const mockRequestUser: RequestUser = {
    id: 1,
    email: 'user@example.com',
    roles: [UserRole.ADMIN],
    sites: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplyService,
        {
          provide: getRepositoryToken(Reply),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockReply]),
              getOne: jest.fn().mockResolvedValue(mockReply),
            })),
            create: jest.fn().mockReturnValue(mockReply),
            save: jest.fn().mockResolvedValue(mockReply),
            findOne: jest.fn().mockResolvedValue(mockReply),
            findOneOrFail: jest.fn().mockResolvedValue(mockReply),
          },
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockComment),
            findOneOrFail: jest.fn().mockResolvedValue(mockComment),
            save: jest.fn().mockResolvedValue(mockComment),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReplyService>(ReplyService);
    replyRepository = module.get<Repository<Reply>>(getRepositoryToken(Reply));
    commentRepository = module.get<Repository<Comment>>(getRepositoryToken(Comment));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all replies for a site', async () => {
      const result = await service.findAll(mockSite);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockReply);
    });
  });

  describe('create', () => {
    it('should create a new reply', async () => {
      const createDto = {
        comment_id: 1,
        message: 'New reply',
      };

      const result = await service.create(createDto, mockSite, mockRequestUser);

      expect(commentRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: createDto.comment_id, site_id: mockSite.id },
        relations: ['user'],
      });
      expect(replyRepository.create).toHaveBeenCalledWith({
        comment_id: createDto.comment_id,
        user_id: mockRequestUser.id,
        message: createDto.message,
      });
      expect(replyRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('reply.created', {
        reply: mockReply,
        comment: mockComment,
        site: mockSite,
      });
      expect(result).toEqual(mockReply);
    });

    it('should throw error if comment does not exist', async () => {
      jest.spyOn(commentRepository, 'findOneOrFail').mockRejectedValue(new Error('Entity not found'));

      const createDto = {
        comment_id: 999,
        message: 'New reply',
      };

      await expect(service.create(createDto, mockSite, mockRequestUser)).rejects.toThrow('Entity not found');
    });

    it('should mark comment as resolved if reply contains resolve marker', async () => {
      const createDto = {
        comment_id: 1,
        message: '{{{resolved}}}',
      };
      const unresolvedComment = {
        ...mockComment,
        resolved: false,
        get viewed() {
          return null;
        },
      } as Comment;

      // Mock isResolveAdded to return true for the resolve marker
      (replyUtils.isResolveAdded as jest.Mock).mockReturnValue(true);

      jest.spyOn(commentRepository, 'findOneOrFail').mockResolvedValue(unresolvedComment);
      jest.spyOn(commentRepository, 'save').mockResolvedValue({
        ...unresolvedComment,
        resolved: true,
      } as Comment);

      const resolveReply = {
        ...mockReply,
        message: '{{{resolved}}}',
      };
      jest.spyOn(replyRepository, 'create').mockReturnValue(resolveReply);
      jest.spyOn(replyRepository, 'save').mockResolvedValue(resolveReply);
      jest.spyOn(replyRepository, 'findOneOrFail').mockResolvedValue(resolveReply);

      await service.create(createDto, mockSite, mockRequestUser);

      expect(replyUtils.isResolveAdded).toHaveBeenCalledWith('{{{resolved}}}');
      expect(commentRepository.save).toHaveBeenCalledWith(expect.objectContaining({ resolved: true }));
    });

    it('should not mark comment as resolved if already resolved', async () => {
      const createDto = {
        comment_id: 1,
        message: '{{{resolved}}}',
      };
      const resolvedComment = {
        ...mockComment,
        resolved: true, // Already resolved
        get viewed() {
          return null;
        },
      } as Comment;

      // Mock isResolveAdded to return true for the resolve marker
      (replyUtils.isResolveAdded as jest.Mock).mockReturnValue(true);

      jest.spyOn(commentRepository, 'findOneOrFail').mockResolvedValue(resolvedComment);

      const resolveReply = {
        ...mockReply,
        message: '{{{resolved}}}',
      };
      jest.spyOn(replyRepository, 'create').mockReturnValue(resolveReply);
      jest.spyOn(replyRepository, 'save').mockResolvedValue(resolveReply);
      jest.spyOn(replyRepository, 'findOneOrFail').mockResolvedValue(resolveReply);

      await service.create(createDto, mockSite, mockRequestUser);

      // commentRepository.save should NOT be called since comment is already resolved
      expect(commentRepository.save).not.toHaveBeenCalled();
    });

    it('should not mark comment as resolved if message does not contain resolve marker', async () => {
      const createDto = {
        comment_id: 1,
        message: 'Regular reply without resolve marker',
      };
      const unresolvedComment = {
        ...mockComment,
        resolved: false,
        get viewed() {
          return null;
        },
      } as Comment;

      // Mock isResolveAdded to return false
      (replyUtils.isResolveAdded as jest.Mock).mockReturnValue(false);

      jest.spyOn(commentRepository, 'findOneOrFail').mockResolvedValue(unresolvedComment);
      jest.spyOn(replyRepository, 'create').mockReturnValue(mockReply);
      jest.spyOn(replyRepository, 'save').mockResolvedValue(mockReply);
      jest.spyOn(replyRepository, 'findOneOrFail').mockResolvedValue(mockReply);

      await service.create(createDto, mockSite, mockRequestUser);

      // commentRepository.save should NOT be called since no resolve marker
      expect(commentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('addResolveReply', () => {
    it('should create a resolve reply', async () => {
      const resolveReply = {
        id: 2,
        comment_id: 1,
        user_id: 1,
        message: '{{{resolved}}}',
        created: new Date(),
        updated: new Date(),
      } as Reply;

      jest.spyOn(replyRepository, 'create').mockReturnValue(resolveReply);
      jest.spyOn(replyRepository, 'save').mockResolvedValue(resolveReply);

      const result = await service.addResolveReply(mockComment, 1);

      expect(replyRepository.create).toHaveBeenCalledWith({
        comment_id: mockComment.id,
        user_id: 1,
        message: '{{{resolved}}}',
      });
      expect(replyRepository.save).toHaveBeenCalledWith(resolveReply);
      expect(result).toEqual(resolveReply);
    });
  });

  describe('update', () => {
    it('should update a reply', async () => {
      const updateDto = {
        id: 1,
        message: 'Updated reply',
      };

      const result = await service.update(1, updateDto, mockSite, mockRequestUser);

      expect(replyRepository.save).toHaveBeenCalledWith({
        ...mockReply,
        message: updateDto.message,
      });
      expect(result).toEqual({
        ...mockReply,
        message: updateDto.message,
      });
    });

    it('should throw error if reply does not exist', async () => {
      jest.spyOn(replyRepository, 'findOneOrFail').mockRejectedValue(new Error('Entity not found'));

      const updateDto = {
        id: 999,
        message: 'Updated reply',
      };

      await expect(service.update(999, updateDto, mockSite, mockRequestUser)).rejects.toThrow('Entity not found');
    });

    it('should throw BadRequestException if user is not the author', async () => {
      const otherUserReply = { ...mockReply, user_id: 2 };
      jest.spyOn(replyRepository, 'findOneOrFail').mockResolvedValue(otherUserReply);

      const updateDto = {
        id: 1,
        message: 'Updated reply',
      };

      await expect(service.update(1, updateDto, mockSite, mockRequestUser)).rejects.toThrow(BadRequestException);
    });
  });
});
