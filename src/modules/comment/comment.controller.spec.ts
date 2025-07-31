import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment } from './comment.entity';
import { Site } from '../site/site.entity';
import { User } from '../user/user.entity';
import { RequestUser } from '../../types/express';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('CommentController', () => {
  let controller: CommentController;
  let service: CommentService;

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    username: 'testuser',
    password: 'hashed',
    active: true,
    roles: [],
    created: new Date(),
    updated: new Date(),
    sites: [],
    comments: [],
    replies: [],
    commentViews: [],
    get color() {
      return '#4C53F1';
    },
  } as User;

  const mockSite = {
    id: 1,
    name: 'Test Site',
    url: 'https://test.com',
    domain: 'test.com',
    license: 'ABC123',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  } as Site;

  const mockComment = {
    id: 1,
    uniqid: 'test123',
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

  const mockRequestUser: RequestUser = {
    id: 1,
    email: 'user@example.com',
    roles: ['COLLABORATOR'],
    sites: [],
  };

  const mockCommentService = {
    findAll: jest.fn().mockResolvedValue([mockComment]),
    create: jest.fn().mockResolvedValue(mockComment),
    update: jest.fn().mockResolvedValue(mockComment),
    markAsViewed: jest.fn().mockResolvedValue(mockComment),
    markAsUnviewed: jest.fn().mockResolvedValue(mockComment),
    markAllAsViewed: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockCommentRepository = {
    find: jest.fn().mockResolvedValue([mockComment]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: mockCommentService,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
      ],
    })
      .overrideGuard(CookieAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OriginGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CommentController>(CommentController);
    service = module.get<CommentService>(CommentService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all comments for current site', async () => {
      const result = await controller.findAll(mockSite, mockRequestUser);

      expect(service.findAll).toHaveBeenCalledWith(mockSite, mockRequestUser);
      expect(result).toEqual([mockComment]);
    });
  });

  describe('list', () => {
    it('should return all comments (admin endpoint)', async () => {
      const result = await controller.list();

      expect(mockCommentRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockComment]);
    });
  });

  describe('create', () => {
    it('should create a new comment without screenshot', async () => {
      const createDto: CreateCommentDto = {
        message: 'New comment',
        url: 'https://test.com/new-page',
        details: {
          vh: 768,
          vw: 1024,
          vx: 100,
          vy: 200,
          env: 'production',
        },
        reference: '#element-123',
      };

      const result = await controller.create(
        createDto,
        null as unknown as Express.Multer.File,
        mockSite,
        mockRequestUser,
      );

      expect(service.create).toHaveBeenCalledWith(
        createDto,
        mockSite,
        mockRequestUser,
      );
      expect(result).toEqual(mockComment);
    });

    it('should create a new comment with screenshot', async () => {
      const createDto: CreateCommentDto = {
        message: 'New comment with screenshot',
        url: 'https://test.com/new-page',
        details: undefined,
        reference: undefined,
      };

      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
        originalname: 'screenshot.png',
      } as Express.Multer.File;

      const createDtoWithScreenshot = { ...createDto, screenshot: mockFile };

      const result = await controller.create(
        createDto,
        mockFile,
        mockSite,
        mockRequestUser,
      );

      expect(service.create).toHaveBeenCalledWith(
        createDtoWithScreenshot,
        mockSite,
        mockRequestUser,
      );
      expect(result).toEqual(mockComment);
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      const updateDto: UpdateCommentDto = {
        id: 1,
        message: 'Updated comment',
      };

      const result = await controller.update(
        1,
        updateDto,
        mockSite,
        mockRequestUser,
      );

      expect(service.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockSite,
        mockRequestUser,
      );
      expect(result).toEqual(mockComment);
    });
  });

  describe('markAsViewed', () => {
    it('should mark comment as viewed', async () => {
      const result = await controller.markAsViewed(
        1,
        mockSite,
        mockRequestUser,
      );

      expect(service.markAsViewed).toHaveBeenCalledWith(
        1,
        mockSite,
        mockRequestUser,
      );
      expect(result).toEqual(mockComment);
    });
  });

  describe('markAsUnviewed', () => {
    it('should mark comment as unviewed', async () => {
      const result = await controller.markAsUnviewed(
        1,
        mockSite,
        mockRequestUser,
      );

      expect(service.markAsUnviewed).toHaveBeenCalledWith(
        1,
        mockSite,
        mockRequestUser,
      );
      expect(result).toEqual(mockComment);
    });
  });

  describe('markAllAsViewed', () => {
    it('should mark all comments as viewed', async () => {
      const result = await controller.markAllAsViewed(
        mockSite,
        mockRequestUser,
      );

      expect(service.markAllAsViewed).toHaveBeenCalledWith(
        mockSite,
        mockRequestUser,
      );
      expect(result).toEqual({ success: true });
    });
  });
});
