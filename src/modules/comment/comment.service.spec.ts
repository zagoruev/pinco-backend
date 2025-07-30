import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment } from './comment.entity';
import { CommentView } from './comment-view.entity';
import { Reply } from '../reply/reply.entity';
import { Site } from '../site/site.entity';
import { User, UserRole } from '../user/user.entity';
import { ScreenshotService } from '../screenshot/screenshot.service';
import { TokenPayload } from '../auth/token.service';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: Repository<Comment>;
  let commentViewRepository: Repository<CommentView>;
  let screenshotService: ScreenshotService;
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
    email: 'test@example.com',
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
    url: 'https://example.com/page',
    details: { vh: 768, vw: 1024, vx: 0, vy: 0, env: 'test' },
    reference: { x: 100, y: 200, selector: '#test' },
    resolved: false,
    screenshot: null,
    created: new Date(),
    updated: new Date(),
    user: mockUser,
    site: mockSite,
    replies: [],
    views: [],
  };

  const mockTokenPayload: TokenPayload = {
    id: 1,
    email: 'test@example.com',
    roles: [UserRole.COMMENTER],
    sites: [1],
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
          provide: getRepositoryToken(Reply),
          useValue: {},
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
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('findAll', () => {
    it('should return all comments for a site', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockComment]),
      };

      jest
        .spyOn(commentRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest
        .spyOn(screenshotService, 'getUrl')
        .mockReturnValue('https://example.com/screenshots/abc123.jpg');

      const result = await service.findAll(mockSite, mockTokenPayload);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockComment.id,
        message: mockComment.message,
        viewed: null,
        screenshot: undefined,
      });
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

      const result = await service.create(
        createDto,
        mockSite,
        mockTokenPayload,
      );

      expect(result).toMatchObject({
        id: mockComment.id,
        message: mockComment.message,
        viewed: null,
        screenshot: undefined,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('comment.created', {
        comment: mockComment,
        site: mockSite,
      });
    });

    it('should handle screenshot upload', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const createDtoWithScreenshot = { ...createDto, screenshot: file };

      jest.spyOn(commentRepository, 'create').mockReturnValue(mockComment);
      jest
        .spyOn(commentRepository, 'save')
        .mockResolvedValue({ ...mockComment, screenshot: 'abc123def4567.jpg' });
      jest
        .spyOn(commentRepository, 'findOne')
        .mockResolvedValue({ ...mockComment, screenshot: 'abc123def4567.jpg' });
      jest
        .spyOn(screenshotService, 'save')
        .mockResolvedValue('abc123def4567.jpg');
      jest
        .spyOn(screenshotService, 'getUrl')
        .mockReturnValue('https://example.com/screenshots/abc123def4567.jpg');

      const result = await service.create(
        createDtoWithScreenshot,
        mockSite,
        mockTokenPayload,
      );

      expect(screenshotService.save).toHaveBeenCalledWith(
        file,
        expect.stringMatching(/\.jpg$/),
      );
      expect(result.screenshot).toBe(
        'https://example.com/screenshots/abc123def4567.jpg',
      );
    });

    it('should throw BadRequestException for invalid reference', async () => {
      const invalidDto = { ...createDto, reference: 'invalid json' };

      await expect(
        service.create(invalidDto, mockSite, mockTokenPayload),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto = {
      id: 1,
      message: 'Updated comment',
    };

    it('should update a comment', async () => {
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment);
      jest
        .spyOn(commentRepository, 'save')
        .mockResolvedValue({ ...mockComment, message: updateDto.message });
      jest.spyOn(commentViewRepository, 'findOne').mockResolvedValue(null);

      const result = await service.update(
        1,
        updateDto,
        mockSite,
        mockTokenPayload,
      );

      expect(result.message).toBe(updateDto.message);
    });

    it('should throw NotFoundException if comment not found', async () => {
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update(999, updateDto, mockSite, mockTokenPayload),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not the author', async () => {
      const differentUserPayload = { ...mockTokenPayload, id: 2 };
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment);

      await expect(
        service.update(1, updateDto, mockSite, differentUserPayload),
      ).rejects.toThrow(BadRequestException);
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

      const result = await service.markAsViewed(1, mockSite, mockTokenPayload);

      expect(result).toEqual({
        viewed: viewRecord.viewed,
        user_id: viewRecord.user_id,
      });
    });
  });

  describe('markAsUnviewed', () => {
    it('should mark comment as unviewed', async () => {
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment);
      jest
        .spyOn(commentViewRepository, 'delete')
        .mockResolvedValue({ affected: 1 } as any);

      const result = await service.markAsUnviewed(
        1,
        mockSite,
        mockTokenPayload,
      );

      expect(result).toEqual({
        viewed: null,
        user_id: mockTokenPayload.id,
      });
    });
  });

  describe('markAllAsViewed', () => {
    it('should mark all comments as viewed', async () => {
      jest.spyOn(commentRepository, 'find').mockResolvedValue([mockComment]);

      await service.markAllAsViewed(mockSite, mockTokenPayload);

      expect(commentViewRepository.save).toHaveBeenCalledWith([
        {
          comment_id: mockComment.id,
          user_id: mockTokenPayload.id,
          viewed: expect.any(Date) as Date,
        },
      ]);
    });
  });
});
