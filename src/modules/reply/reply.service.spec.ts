import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReplyService } from './reply.service';
import { Reply } from './reply.entity';
import { Comment } from '../comment/comment.entity';
import { Site } from '../site/site.entity';
import { User, UserRole } from '../user/user.entity';
import { TokenPayload } from '../auth/token.service';

describe('ReplyService', () => {
  let service: ReplyService;
  let replyRepository: Repository<Reply>;
  let commentRepository: Repository<Comment>;
  let eventEmitter: EventEmitter2;

  const mockSite: Site = {
    id: 1,
    name: 'Test Site',
    license: 'LICENSE-123',
    domain: 'test.com',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  };

  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    color: '#FF0000',
    username: 'testuser',
    password: 'hashed',
    active: true,
    roles: [UserRole.COMMENTER],
    secret_token: null,
    secret_expires: null,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
    replies: [],
    commentViews: [],
  };

  const mockComment: Comment = {
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
  };

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

  const mockTokenPayload: TokenPayload = {
    sub: 1,
    email: 'user@example.com',
    sites: [1],
    roles: ['COMMENTER'],
  };

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
          },
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockComment),
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
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all replies for a site', async () => {
      const result = await service.findAll(mockSite);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockReply.id,
        comment_id: mockReply.comment_id,
        message: mockReply.message,
        created: mockReply.created.toISOString(),
        updated: mockReply.updated.toISOString(),
        user_id: mockReply.user_id,
      });
    });
  });

  describe('create', () => {
    it('should create a new reply', async () => {
      const createDto = {
        comment_id: 1,
        message: 'New reply',
      };

      const result = await service.create(
        createDto,
        mockSite,
        mockTokenPayload,
      );

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.comment_id, site_id: mockSite.id },
        relations: ['user'],
      });
      expect(replyRepository.create).toHaveBeenCalledWith({
        comment_id: createDto.comment_id,
        user_id: mockTokenPayload.sub,
        message: createDto.message,
      });
      expect(replyRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('reply.created', {
        reply: mockReply,
        comment: mockComment,
        site: mockSite,
      });
      expect(result).toEqual({
        id: mockReply.id,
        comment_id: mockReply.comment_id,
        message: mockReply.message,
        created: mockReply.created.toISOString(),
        updated: mockReply.updated.toISOString(),
        user_id: mockReply.user_id,
      });
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      jest.spyOn(commentRepository, 'findOne').mockResolvedValueOnce(null);

      const createDto = {
        comment_id: 999,
        message: 'New reply',
      };

      await expect(
        service.create(createDto, mockSite, mockTokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a reply', async () => {
      const updateDto = {
        id: 1,
        message: 'Updated reply',
      };

      const result = await service.update(
        1,
        updateDto,
        mockSite,
        mockTokenPayload,
      );

      expect(replyRepository.save).toHaveBeenCalledWith({
        ...mockReply,
        message: updateDto.message,
      });
      expect(result).toEqual({
        id: mockReply.id,
        comment_id: mockReply.comment_id,
        message: updateDto.message,
        created: mockReply.created.toISOString(),
        updated: mockReply.updated.toISOString(),
        user_id: mockReply.user_id,
      });
    });

    it('should throw NotFoundException if reply does not exist', async () => {
      jest.spyOn(replyRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      } as any);

      const updateDto = {
        id: 999,
        message: 'Updated reply',
      };

      await expect(
        service.update(999, updateDto, mockSite, mockTokenPayload),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not the author', async () => {
      const otherUserReply = { ...mockReply, user_id: 2 };
      jest.spyOn(replyRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(otherUserReply),
      } as any);

      const updateDto = {
        id: 1,
        message: 'Updated reply',
      };

      await expect(
        service.update(1, updateDto, mockSite, mockTokenPayload),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
