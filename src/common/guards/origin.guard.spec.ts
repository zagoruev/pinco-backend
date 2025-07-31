import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OriginGuard } from './origin.guard';
import { Site } from '../../modules/site/site.entity';
import { User } from '../../modules/user/user.entity';
import { UserSite, UserSiteRole } from '../../modules/user/user-site.entity';
import { RequestUser } from '../../types/express';

describe('OriginGuard', () => {
  let guard: OriginGuard;
  let siteRepository: Repository<Site>;

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

  const mockSiteRepository = {
    findOne: jest.fn(),
  };

  const createMockExecutionContext = (
    origin: string,
    user?: RequestUser,
  ): ExecutionContext => {
    const mockRequest = {
      headers: {
        origin: origin || undefined,
        referer: undefined,
      },
      user,
      site: undefined,
    };

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OriginGuard,
        {
          provide: getRepositoryToken(Site),
          useValue: mockSiteRepository,
        },
      ],
    }).compile();

    guard = module.get<OriginGuard>(OriginGuard);
    siteRepository = module.get<Repository<Site>>(getRepositoryToken(Site));

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw ForbiddenException for valid origin without user', async () => {
      const context = createMockExecutionContext('https://test.com');

      mockSiteRepository.findOne.mockResolvedValue(mockSite);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('User does not have access to this site'),
      );

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'test.com', active: true },
      });
    });

    it('should extract domain from origin URL', async () => {
      const context = createMockExecutionContext(
        'https://subdomain.test.com:8080/path',
        mockRequestUser,
      );

      mockSiteRepository.findOne.mockResolvedValue(mockSite);

      const result = await guard.canActivate(context);

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'subdomain.test.com', active: true },
      });
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when origin header missing', async () => {
      const context = createMockExecutionContext('');

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Origin not provided',
      );
    });

    it('should throw ForbiddenException when site not found', async () => {
      const context = createMockExecutionContext('https://invalid.com');

      mockSiteRepository.findOne.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or inactive site',
      );
    });

    it('should throw ForbiddenException for inactive site', async () => {
      const context = createMockExecutionContext('https://test.com');

      // Inactive sites won't be found because query includes active: true
      mockSiteRepository.findOne.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Invalid or inactive site'),
      );
    });

    it('should throw ForbiddenException when authenticated user not associated with site', async () => {
      const userWithoutSite: RequestUser = {
        ...mockRequestUser,
        sites: [],
      };
      const context = createMockExecutionContext(
        'https://test.com',
        userWithoutSite,
      );

      mockSiteRepository.findOne.mockResolvedValue(mockSite);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'User does not have access to this site',
      );
    });

    it('should allow authenticated user associated with site', async () => {
      const context = createMockExecutionContext(
        'https://test.com',
        mockRequestUser,
      );

      mockSiteRepository.findOne.mockResolvedValue(mockSite);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException for unauthenticated user', async () => {
      const context = createMockExecutionContext('https://test.com');

      mockSiteRepository.findOne.mockResolvedValue(mockSite);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('User does not have access to this site'),
      );
    });

    it('should handle origin with trailing slash', async () => {
      const context = createMockExecutionContext(
        'https://test.com/',
        mockRequestUser,
      );

      mockSiteRepository.findOne.mockResolvedValue(mockSite);

      const result = await guard.canActivate(context);

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'test.com', active: true },
      });
      expect(result).toBe(true);
    });

    it('should handle origin with www prefix', async () => {
      const context = createMockExecutionContext(
        'https://www.test.com',
        mockRequestUser,
      );

      mockSiteRepository.findOne.mockResolvedValue(mockSite);

      const result = await guard.canActivate(context);

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'www.test.com', active: true },
      });
      expect(result).toBe(true);
    });
  });
});
