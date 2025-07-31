import { Test, TestingModule } from '@nestjs/testing';

import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { RequestUser } from '../../types/express';
import { Site } from '../site/site.entity';
import { UserSite, UserSiteRole } from '../user/user-site.entity';
import { User } from '../user/user.entity';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';

describe('WidgetController', () => {
  let controller: WidgetController;
  let service: WidgetService;

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

  const mockUserSite = {
    user_id: 1,
    site_id: 1,
    roles: [UserSiteRole.COLLABORATOR],
    invite_code: null,
    created: new Date(),
    updated: new Date(),
    user: mockUser,
    site: mockSite,
  } as UserSite;

  const mockRequestUser: RequestUser = {
    id: 1,
    email: 'user@example.com',
    roles: ['COLLABORATOR'],
    sites: [mockUserSite],
  };

  const mockRequest = {
    headers: {
      origin: 'https://test.com',
      referer: 'https://test.com/page',
    },
  } as any;

  const mockWidgetService = {
    generateWidgetScript: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WidgetController],
      providers: [
        {
          provide: WidgetService,
          useValue: mockWidgetService,
        },
      ],
    })
      .overrideGuard(CookieAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OriginGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WidgetController>(WidgetController);
    service = module.get<WidgetService>(WidgetService);

    jest.clearAllMocks();
    mockWidgetService.generateWidgetScript.mockResolvedValue('/* Widget script */');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWidgetScript', () => {
    it('should return widget script for authenticated user', async () => {
      const key = 'test-license-key';
      const result = await controller.getWidgetScript(key, mockRequestUser, mockRequest);

      expect(service.generateWidgetScript).toHaveBeenCalledWith(key, mockRequestUser, mockRequest);
      expect(result).toEqual('/* Widget script */');
    });

    it('should return widget script for unauthenticated user', async () => {
      const key = 'test-license-key';
      const result = await controller.getWidgetScript(key, undefined as unknown as RequestUser, mockRequest);

      expect(service.generateWidgetScript).toHaveBeenCalledWith(key, undefined, mockRequest);
      expect(result).toEqual('/* Widget script */');
    });

    it('should handle request with only referer header', async () => {
      const key = 'test-license-key';
      const requestWithOnlyReferer = {
        headers: {
          referer: 'https://test.com/page',
        },
      } as any;

      const result = await controller.getWidgetScript(key, mockRequestUser, requestWithOnlyReferer);

      expect(service.generateWidgetScript).toHaveBeenCalledWith(key, mockRequestUser, requestWithOnlyReferer);
      expect(result).toEqual('/* Widget script */');
    });

    it('should pass through service errors', async () => {
      const key = 'test-license-key';
      const error = new Error('Service error');
      mockWidgetService.generateWidgetScript.mockRejectedValueOnce(error);

      await expect(controller.getWidgetScript(key, mockRequestUser, mockRequest)).rejects.toThrow('Service error');
    });
  });
});
