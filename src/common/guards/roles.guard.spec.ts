import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { Site } from '../../modules/site/site.entity';
import { UserSiteRole } from '../../modules/user/user-site.entity';
import { UserRole } from '../../modules/user/user.entity';
import { User } from '../../modules/user/user.entity';
import { RequestUser } from '../../types/express';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

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

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockExecutionContext = (user?: RequestUser, site?: Site): ExecutionContext => {
    const mockRequest = {
      user,
      site,
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
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles required', () => {
      const context = createMockExecutionContext();

      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [context.getHandler(), context.getClass()]);
      expect(result).toBe(true);
    });

    it('should return true for ROOT user when ROOT role required', () => {
      const rootUser: RequestUser = {
        id: 1,
        email: 'root@example.com',
        roles: [UserRole.ROOT],
        sites: [],
      };
      const context = createMockExecutionContext(rootUser);

      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ROOT]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for ADMIN user when ADMIN role required', () => {
      const adminUser: RequestUser = {
        id: 1,
        email: 'admin@example.com',
        roles: [UserRole.ADMIN],
        sites: [],
      };
      const context = createMockExecutionContext(adminUser);

      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when checking site-specific roles', () => {
      const userWithSiteRole: RequestUser = {
        id: 1,
        email: 'user@example.com',
        roles: [],
        sites: [
          {
            user_id: 1,
            site_id: 1,
            roles: [UserSiteRole.ADMIN],
            invite_code: null,
            created: new Date(),
            updated: new Date(),
            user: {} as User,
            site: mockSite,
          },
        ],
      };
      const context = createMockExecutionContext(userWithSiteRole, mockSite);

      mockReflector.getAllAndOverride.mockReturnValue([UserSiteRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user not authenticated', () => {
      const context = createMockExecutionContext();

      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user has no roles', () => {
      const userWithNoRoles: RequestUser = {
        id: 1,
        email: 'user@example.com',
        roles: [],
        sites: [],
      };
      const context = createMockExecutionContext(userWithNoRoles);

      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should check multiple required roles', () => {
      const adminUser: RequestUser = {
        id: 1,
        email: 'admin@example.com',
        roles: [UserRole.ADMIN],
        sites: [],
      };
      const context = createMockExecutionContext(adminUser);

      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.ROOT]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
