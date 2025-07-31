import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../types/express';
import { Comment } from '../comment/comment.entity';
import { Reply } from '../reply/reply.entity';
import { UserSite } from '../user/user-site.entity';
import { User, UserRole } from '../user/user.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { SiteController } from './site.controller';
import { Site } from './site.entity';
import { SiteService } from './site.service';

describe('SiteController', () => {
  let controller: SiteController;
  let service: SiteService;

  const mockSite = {
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
  } as Site;

  const mockUser: RequestUser = {
    id: 1,
    email: 'admin@example.com',
    roles: ['ADMIN'],
    sites: [],
  };

  const mockSiteService = {
    create: jest.fn().mockResolvedValue(mockSite),
    update: jest.fn().mockResolvedValue(mockSite),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const mockSiteRepository = {
    find: jest.fn().mockResolvedValue([mockSite]),
    findOneOrFail: jest.fn().mockResolvedValue(mockSite),
  };

  const mockUserSiteRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockCommentRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockReplyRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiteController],
      providers: [
        {
          provide: SiteService,
          useValue: mockSiteService,
        },
        {
          provide: getRepositoryToken(Site),
          useValue: mockSiteRepository,
        },
        {
          provide: getRepositoryToken(UserSite),
          useValue: mockUserSiteRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(Reply),
          useValue: mockReplyRepository,
        },
      ],
    })
      .overrideGuard(CookieAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SiteController>(SiteController);
    service = module.get<SiteService>(SiteService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return an array of sites', async () => {
      const result = await controller.list();

      expect(mockSiteRepository.find).toHaveBeenCalledWith({
        order: { created: 'DESC' },
      });
      expect(result).toEqual([mockSite]);
    });
  });

  describe('findOne', () => {
    it('should return a single site', async () => {
      const result = await controller.findOne(1);

      expect(mockSiteRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockSite);
    });
  });

  describe('create', () => {
    it('should create a new site', async () => {
      const createDto: CreateSiteDto = {
        name: 'New Site',
        license: 'LICENSE-456',
        url: 'https://new.com',
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockSite);
    });
  });

  describe('update', () => {
    it('should update a site', async () => {
      const updateDto: UpdateSiteDto = {
        name: 'Updated Site',
      };

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockSite);
    });
  });

  describe('remove', () => {
    it('should remove a site', async () => {
      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });

  describe('getSiteUsers', () => {
    it('should return all users for a site', async () => {
      const mockUserSites = [
        {
          user_id: 1,
          site_id: 1,
          user: mockUser,
        },
      ];
      mockUserSiteRepository.find.mockResolvedValueOnce(mockUserSites);

      const result = await controller.getSiteUsers(1);

      expect(mockUserSiteRepository.find).toHaveBeenCalledWith({
        where: { site_id: 1 },
        relations: ['user'],
        order: { created: 'DESC' },
      });
      expect(result).toEqual(mockUserSites);
    });
  });

  describe('getSiteComments', () => {
    it('should return all comments for a site', async () => {
      const mockComments = [{ id: 1, site_id: 1 }];
      mockCommentRepository.find.mockResolvedValueOnce(mockComments);

      const result = await controller.getSiteComments(1);

      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { site_id: 1 },
      });
      expect(result).toEqual(mockComments);
    });
  });

  describe('getSiteReplies', () => {
    it('should return all replies for a site', async () => {
      const mockReplies = [{ id: 1, comment: { site_id: 1 } }];
      mockReplyRepository.find.mockResolvedValueOnce(mockReplies);

      const result = await controller.getSiteReplies(1);

      expect(mockReplyRepository.find).toHaveBeenCalledWith({
        where: { comment: { site_id: 1 } },
        relations: ['comment', 'comment.user'],
      });
      expect(result).toEqual(mockReplies);
    });
  });
});
