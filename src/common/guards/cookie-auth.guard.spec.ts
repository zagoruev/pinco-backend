import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { TokenService } from '../../modules/auth/token.service';
import { Site } from '../../modules/site/site.entity';
import { SiteService } from '../../modules/site/site.service';
import { UserSite } from '../../modules/user/user-site.entity';
import { User, UserRole } from '../../modules/user/user.entity';
import { CookieAuthGuard, OPTIONAL_AUTH_KEY } from './cookie-auth.guard';

describe('CookieAuthGuard', () => {
  let guard: CookieAuthGuard;
  let tokenService: TokenService;
  let siteService: SiteService;
  let reflector: Reflector;

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    username: 'testuser',
    password: 'hashed',
    active: true,
    roles: [UserRole.ADMIN],
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
    roles: ['COLLABORATOR'],
    invite_code: null,
    created: new Date(),
    updated: new Date(),
    user: mockUser,
    site: mockSite,
  } as UserSite;

  const mockTokenService = {
    verifyToken: jest.fn(),
  };

  const mockSiteService = {
    getUserSites: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockExecutionContext = (signedCookies: Record<string, string> = {}): ExecutionContext => {
    const mockRequest = {
      signedCookies,
    };

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CookieAuthGuard,
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: SiteService,
          useValue: mockSiteService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<CookieAuthGuard>(CookieAuthGuard);
    tokenService = module.get<TokenService>(TokenService);
    siteService = module.get<SiteService>(SiteService);
    reflector = module.get<Reflector>(Reflector);

    // Reset all mocks
    jest.clearAllMocks();

    // Default: not optional auth
    mockReflector.getAllAndOverride.mockReturnValue(false);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid token in signed cookies', async () => {
      const token = 'valid-token';
      const context = createMockExecutionContext({ token });
      const request = context.switchToHttp().getRequest();

      const tokenPayload = {
        id: 1,
        email: 'user@example.com',
        roles: ['ADMIN'],
      };

      mockTokenService.verifyToken.mockReturnValue(tokenPayload);
      mockSiteService.getUserSites.mockResolvedValue([mockUserSite]);

      const result = await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(OPTIONAL_AUTH_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(siteService.getUserSites).toHaveBeenCalledWith(tokenPayload.id);
      expect(request.user).toEqual({
        ...tokenPayload,
        sites: [mockUserSite],
      });
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when no token', async () => {
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('No authentication token found');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const context = createMockExecutionContext({ token: 'invalid-token' });

      mockTokenService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid authentication token');
    });

    it('should handle user with no sites', async () => {
      const token = 'valid-token';
      const context = createMockExecutionContext({ token });
      const request = context.switchToHttp().getRequest();

      const tokenPayload = {
        id: 1,
        email: 'user@example.com',
        roles: ['ADMIN'],
      };

      mockTokenService.verifyToken.mockReturnValue(tokenPayload);
      mockSiteService.getUserSites.mockResolvedValue([]);

      const result = await guard.canActivate(context);

      expect(request.user.sites).toEqual([]);
      expect(result).toBe(true);
    });

    describe('optional authentication', () => {
      beforeEach(() => {
        mockReflector.getAllAndOverride.mockReturnValue(true);
      });

      it('should return true when no token and auth is optional', async () => {
        const context = createMockExecutionContext();

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(tokenService.verifyToken).not.toHaveBeenCalled();
      });

      it('should return true with valid token when auth is optional', async () => {
        const token = 'valid-token';
        const context = createMockExecutionContext({ token });
        const request = context.switchToHttp().getRequest();

        const tokenPayload = {
          id: 1,
          email: 'user@example.com',
          roles: ['ADMIN'],
        };

        mockTokenService.verifyToken.mockReturnValue(tokenPayload);
        mockSiteService.getUserSites.mockResolvedValue([mockUserSite]);

        const result = await guard.canActivate(context);

        expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
        expect(request.user).toEqual({
          ...tokenPayload,
          sites: [mockUserSite],
        });
        expect(result).toBe(true);
      });

      it('should return true even with invalid token when auth is optional', async () => {
        const context = createMockExecutionContext({ token: 'invalid-token' });

        mockTokenService.verifyToken.mockImplementation(() => {
          throw new Error('Invalid token');
        });

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(tokenService.verifyToken).toHaveBeenCalled();
      });
    });
  });
});
