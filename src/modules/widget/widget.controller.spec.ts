import { Test, TestingModule } from '@nestjs/testing';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';
import { Site } from '../site/site.entity';
import { User } from '../user/user.entity';
import { UserSite, UserSiteRole } from '../user/user-site.entity';
import { RequestUser } from '../../types/express';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { OriginGuard } from '../../common/guards/origin.guard';

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

  const mockWidgetData = {
    site: mockSite,
    user: {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      color: mockUser.color,
      roles: mockUserSite.roles,
    },
    comments: [],
    replies: [],
  };

  const mockWidgetService = {
    generateWidgetScript: jest.fn().mockReturnValue('/* Widget script */'),
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

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWidgetScript', () => {
    it('should return widget script for authenticated user', () => {
      const key = 'test-license-key';
      const result = controller.getWidgetScript(key, mockRequestUser);

      expect(service.generateWidgetScript).toHaveBeenCalledWith(
        key,
        mockRequestUser,
      );
      expect(result).toEqual('/* Widget script */');
    });

    it('should return widget script for unauthenticated user', () => {
      const key = 'test-license-key';
      const result = controller.getWidgetScript(
        key,
        undefined as unknown as RequestUser,
      );

      expect(service.generateWidgetScript).toHaveBeenCalledWith(key, undefined);
      expect(result).toEqual('/* Widget script */');
    });
  });
});
