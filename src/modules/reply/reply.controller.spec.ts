import { Test, TestingModule } from '@nestjs/testing';
import { ReplyController } from './reply.controller';
import { ReplyService } from './reply.service';
import { Site } from '../site/site.entity';
import { RequestUser } from '../../types/express';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { Reply } from './reply.entity';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { UserSiteRole } from '../user/user-site.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ReplyController', () => {
  let controller: ReplyController;
  let service: ReplyService;

  const mockSite: Site = {
    id: 1,
    name: 'Test Site',
    license: 'LICENSE-123',
    url: 'https://test.com/',
    domain: 'test.com',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  };

  const mockRequestUser: RequestUser = {
    id: 1,
    email: 'user@example.com',
    roles: [UserSiteRole.COLLABORATOR],
    sites: [],
  };

  const mockReplyResponse = {
    id: 1,
    comment_id: 1,
    message: 'Test reply',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    user_id: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReplyController],
      providers: [
        {
          provide: ReplyService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockReplyResponse]),
            create: jest.fn().mockResolvedValue(mockReplyResponse),
            update: jest.fn().mockResolvedValue(mockReplyResponse),
          },
        },
        {
          provide: getRepositoryToken(Reply),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(CookieAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OriginGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReplyController>(ReplyController);
    service = module.get<ReplyService>(ReplyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all replies for the site', async () => {
      const result = await controller.findAll(mockSite);

      expect(service.findAll).toHaveBeenCalledWith(mockSite);
      expect(result).toEqual([mockReplyResponse]);
    });
  });

  describe('create', () => {
    it('should create a new reply', async () => {
      const createDto: CreateReplyDto = {
        comment_id: 1,
        message: 'New reply',
      };

      const result = await controller.create(
        createDto,
        mockSite,
        mockRequestUser,
      );

      expect(service.create).toHaveBeenCalledWith(
        createDto,
        mockSite,
        mockRequestUser,
      );
      expect(result).toEqual(mockReplyResponse);
    });
  });

  describe('update', () => {
    it('should update a reply', async () => {
      const updateDto: UpdateReplyDto = {
        id: 1,
        message: 'Updated reply',
      };

      const result = await controller.update(
        '1',
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
      expect(result).toEqual(mockReplyResponse);
    });
  });
});
