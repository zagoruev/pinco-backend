import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment } from './comment.entity';
import { CommentView } from './comment-view.entity';
import { Site } from '../site/site.entity';
import { User, UserRole } from '../user/user.entity';
import { ScreenshotService } from '../screenshot/screenshot.service';
import { ReplyService } from '../reply/reply.service';
import { RequestUser } from '../../types/express';
import { UpdateCommentDto } from './dto/update-comment.dto';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: Repository<Comment>;
  let commentViewRepository: Repository<CommentView>;
  let screenshotService: ScreenshotService;
  let replyService: ReplyService;
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
    email: 'test@example.com',
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

  const mockComment: Comment = {
    id: 1,
    uniqid: 'abc123def4567',
    message: 'Test comment',
    user_id: 1,
    site_id: 1,
    url: 'https://example.com/page',
    details: { vh: 768, vw: 1024, vx: 0, vy: 0, env: 'test' },
    reference: JSON.stringify({ x: 100, y: 200, selector: '#test' }),
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

  const mockRequestUser: RequestUser = {
    id: 1,
    email: 'test@example.com',
    roles: [UserRole.ADMIN],
    sites: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CommentView),
          useValue: {
            save: jest
              .fn()
              .mockImplementation((entities) =>
                Promise.resolve(
                  Array.isArray(entities) ? entities : [entities],
                ),
              ),
            delete: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ReplyService,
          useValue: {
            addResolveReply: jest.fn(),
          },
        },
        {
          provide: ScreenshotService,
          useValue: {
            save: jest.fn(),
            getUrl: jest.fn(),
            delete: jest.fn(),
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

    service = module.get<CommentService>(CommentService);
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
    commentViewRepository = module.get<Repository<CommentView>>(
      getRepositoryToken(CommentView),
    );
    screenshotService = module.get<ScreenshotService>(ScreenshotService);
    replyService = module.get<ReplyService>(ReplyService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('findAll', () => {
    it('should return all comments for a site', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockComment]),
      };

      jest
        .spyOn(commentRepository, 'createQueryBuilder')
        .mockReturnValue(
          queryBuilder as unknown as ReturnType<
            Repository<Comment>['createQueryBuilder']
          >,
        );
      jest
        .spyOn(screenshotService, 'getUrl')
        .mockReturnValue('https://example.com/screenshots/abc123.jpg');

      const result = await service.findAll(mockSite, mockRequestUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockComment.id,
        message: mockComment.message,
        screenshot: 'https://example.com/screenshots/abc123.jpg',
      });
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'comment.views',
        'view',
        'view.user_id = :userId',
        { userId: mockRequestUser.id },
      );
    });
  });

  describe('create', () => {
    const createDto = {
      message: 'New comment',
      url: 'https://example.com/page',
      details: { vh: 768, vw: 1024, vx: 0, vy: 0, env: 'test' },
      reference: JSON.stringify({ x: 100, y: 200, selector: '#test' }),
    };

    it('should create a new comment', async () => {
      jest.spyOn(commentRepository, 'create').mockReturnValue(mockComment);
      jest.spyOn(commentRepository, 'save').mockResolvedValue(mockComment);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment);

      const result = await service.create(createDto, mockSite, mockRequestUser);

      expect(result).toMatchObject({
        id: mockComment.id,
        message: mockComment.message,
        viewed: expect.any(Date),
        screenshot: undefined,
        replies: [],
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('comment.created', {
        comment: mockComment,
        site: mockSite,
      });
      expect(commentViewRepository.save).toHaveBeenCalledWith({
        comment_id: mockComment.id,
        user_id: mockRequestUser.id,
        viewed: expect.any(Date),
      });
    });

    it('should handle screenshot upload', async () => {
      const mockFile = {
        buffer: Buffer.from('base64data'),
        mimetype: 'image/png',
        originalname: 'screenshot.png',
      } as Express.Multer.File;

      const createDtoWithScreenshot = {
        ...createDto,
        screenshot: mockFile,
      };

      jest.spyOn(commentRepository, 'create').mockReturnValue(mockComment);
      jest.spyOn(commentRepository, 'save').mockResolvedValue({
        ...mockComment,
        screenshot: 'abc123def4567.jpg',
      } as Comment);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue({
        ...mockComment,
        screenshot: 'abc123def4567.jpg',
      } as Comment);
      jest
        .spyOn(screenshotService, 'save')
        .mockResolvedValue('abc123def4567.jpg');
      jest
        .spyOn(screenshotService, 'getUrl')
        .mockReturnValue('https://example.com/screenshots/abc123def4567.jpg');

      const result = await service.create(
        createDtoWithScreenshot,
        mockSite,
        mockRequestUser,
      );

      expect(screenshotService.save).toHaveBeenCalledWith(
        mockFile,
        expect.objectContaining({ uniqid: expect.any(String) }),
      );
      expect(result.screenshot).toBe(
        'https://example.com/screenshots/abc123def4567.jpg',
      );
    });

    it('should throw error when findOne returns null after saving', async () => {
      jest.spyOn(commentRepository, 'create').mockReturnValue(mockComment);
      jest.spyOn(commentRepository, 'save').mockResolvedValue(mockComment);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create(createDto, mockSite, mockRequestUser)
      ).rejects.toThrow('Failed to load created comment');
    });
  });

  describe('update', () => {
    const updateDto: UpdateCommentDto = {
      id: 1,
      message: 'Updated comment',
    };

    it('should update a comment', async () => {
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment);
      jest.spyOn(commentRepository, 'save').mockResolvedValue({
        ...mockComment,
        message: updateDto.message,
      } as Comment);
      jest.spyOn(screenshotService, 'getUrl').mockReturnValue('screenshot-url');

      const result = await service.update(
        1,
        updateDto,
        mockSite,
        mockRequestUser,
      );

      expect(result.message).toBe(updateDto.message);
      expect(result.screenshot).toBe('screenshot-url');
    });

    it('should throw NotFoundException if comment not found', async () => {
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update(999, updateDto, mockSite, mockRequestUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not the author', async () => {
      const differentUserPayload = { ...mockRequestUser, id: 2 };
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment);

      await expect(
        service.update(1, updateDto, mockSite, differentUserPayload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should add resolve reply when marking as resolved', async () => {
      const updateDto: UpdateCommentDto = { id: 1, resolved: true };
      const resolvedComment = {
        ...mockComment,
        resolved: false,
        get viewed() {
          return null;
        },
      } as Comment;

      jest
        .spyOn(commentRepository, 'findOne')
        .mockResolvedValue(resolvedComment);
      jest
        .spyOn(commentRepository, 'save')
        .mockResolvedValue({ ...resolvedComment, resolved: true } as Comment);
      jest.spyOn(screenshotService, 'getUrl').mockReturnValue('screenshot-url');

      await service.update(1, updateDto, mockSite, mockRequestUser);

      expect(replyService.addResolveReply).toHaveBeenCalledWith(
        expect.objectContaining({ resolved: true }),
        mockRequestUser.id,
      );
    });

    it('should update reference when provided', async () => {
      const updateDto: UpdateCommentDto = { id: 1, reference: 'new-reference' };
      const existingComment = {
        ...mockComment,
        reference: 'old-reference',
      } as Comment;

      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(existingComment);
      jest.spyOn(commentRepository, 'save').mockResolvedValue({
        ...existingComment,
        reference: 'new-reference',
      } as Comment);
      jest.spyOn(screenshotService, 'getUrl').mockReturnValue('screenshot-url');

      const result = await service.update(1, updateDto, mockSite, mockRequestUser);

      expect(result.reference).toBe('new-reference');
      expect(commentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ reference: 'new-reference' })
      );
    });
  });

  describe('markAsViewed', () => {
    it('should mark comment as viewed', async () => {
      const viewRecord = {
        comment_id: 1,
        user_id: 1,
        viewed: new Date(),
      } as CommentView;

      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment);
      jest.spyOn(commentViewRepository, 'save').mockResolvedValue(viewRecord);

      const result = await service.markAsViewed(1, mockSite, mockRequestUser);

      expect(result).toEqual({
        viewed: viewRecord.viewed,
        user_id: viewRecord.user_id,
      });
    });

    it('should return existing view if already viewed', async () => {
      const existingView = {
        comment_id: 1,
        user_id: 1,
        viewed: new Date('2023-01-01'),
      } as CommentView;
      const commentWithView = {
        ...mockComment,
        views: [existingView],
        get viewed() {
          return existingView.viewed;
        },
      } as Comment;

      jest
        .spyOn(commentRepository, 'findOne')
        .mockResolvedValue(commentWithView);

      const result = await service.markAsViewed(1, mockSite, mockRequestUser);

      expect(result).toEqual({
        viewed: existingView.viewed,
        user_id: mockRequestUser.id,
      });
      expect(commentViewRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment not found', async () => {
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.markAsViewed(999, mockSite, mockRequestUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsUnviewed', () => {
    it('should mark comment as unviewed', async () => {
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment);
      jest
        .spyOn(commentViewRepository, 'delete')
        .mockResolvedValue({ affected: 1 } as unknown as ReturnType<
          Repository<CommentView>['delete']
        >);

      const result = await service.markAsUnviewed(1, mockSite, mockRequestUser);

      expect(result).toEqual({
        viewed: null,
        user_id: mockRequestUser.id,
      });
    });

    it('should throw NotFoundException if comment not found', async () => {
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.markAsUnviewed(999, mockSite, mockRequestUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsViewed', () => {
    it('should mark all comments as viewed', async () => {
      jest.spyOn(commentRepository, 'find').mockResolvedValue([mockComment]);

      await service.markAllAsViewed(mockSite, mockRequestUser);

      expect(commentViewRepository.save).toHaveBeenCalledWith([
        {
          comment_id: mockComment.id,
          user_id: mockRequestUser.id,
          viewed: expect.any(Date),
        },
      ]);
    });
  });
});
