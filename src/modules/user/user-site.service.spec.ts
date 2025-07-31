import { Repository } from 'typeorm';

import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppConfigService } from '../config/config.service';
import { Site } from '../site/site.entity';
import { UserSite, UserSiteRole } from './user-site.entity';
import { UserSiteService } from './user-site.service';
import { User, UserRole } from './user.entity';

describe('UserSiteService', () => {
  let service: UserSiteService;
  let userSiteRepository: Repository<UserSite>;
  let userRepository: Repository<User>;
  let siteRepository: Repository<Site>;
  let jwtService: JwtService;
  let eventEmitter: EventEmitter2;

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
    userSites: [],
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
    roles: [UserSiteRole.ADMIN],
    invite_code: null,
    created: new Date(),
    updated: new Date(),
    user: mockUser,
    site: mockSite,
  } as UserSite;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSiteService,
        {
          provide: getRepositoryToken(UserSite),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Site),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'app.authSecret') return 'test-secret';
              return null;
            }),
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

    service = module.get<UserSiteService>(UserSiteService);
    userSiteRepository = module.get<Repository<UserSite>>(getRepositoryToken(UserSite));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    siteRepository = module.get<Repository<Site>>(getRepositoryToken(Site));
    jwtService = module.get<JwtService>(JwtService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addUserToSite', () => {
    it('should add user to site successfully', async () => {
      jest.spyOn(userSiteRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userSiteRepository, 'save').mockResolvedValue(mockUserSite);
      jest.spyOn(userSiteRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(siteRepository, 'findOne').mockResolvedValue(mockSite);
      jest.spyOn(jwtService, 'sign').mockReturnValue('invite-token');

      await service.addUserToSite(1, 1, [UserSiteRole.COLLABORATOR], true);

      expect(userSiteRepository.save).toHaveBeenCalledWith({
        user_id: 1,
        site_id: 1,
        roles: [UserSiteRole.COLLABORATOR],
        invite_code: expect.any(String),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.invited', {
        user: mockUser,
        site: mockSite,
        invite_token: 'invite-token',
      });
    });

    it('should throw error if user already has access', async () => {
      jest.spyOn(userSiteRepository, 'findOne').mockResolvedValue(mockUserSite);

      await expect(service.addUserToSite(1, 1, [UserSiteRole.COLLABORATOR], false)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeUserFromSite', () => {
    it('should remove user from site', async () => {
      jest.spyOn(userSiteRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.removeUserFromSite(1, 1);

      expect(userSiteRepository.delete).toHaveBeenCalledWith({
        user_id: 1,
        site_id: 1,
      });
    });
  });

  describe('generateInviteToken', () => {
    it('should generate invite token', async () => {
      jest.spyOn(userSiteRepository, 'findOne').mockResolvedValue(mockUserSite);
      jest.spyOn(userSiteRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');

      const result = await service.generateInviteToken(1, 1);

      expect(result).toBe('mock-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { user_id: 1, site_id: 1, invite_code: expect.any(String) },
        { secret: 'test-secret' },
      );
    });
  });

  describe('validateInviteToken', () => {
    it('should validate invite token successfully', async () => {
      const mockPayload = {
        user_id: 1,
        site_id: 1,
        invite_code: 'ABC123',
      };
      const mockUserSiteWithCode = {
        ...mockUserSite,
        invite_code: 'ABC123',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(userSiteRepository, 'findOne').mockResolvedValue(mockUserSiteWithCode);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.validateInviteToken('valid-token');

      expect(result).toEqual({
        userSite: mockUserSiteWithCode,
        user: mockUser,
      });
    });

    it('should throw error for invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateInviteToken('invalid-token')).rejects.toThrow();
    });

    it('should throw UnauthorizedException if user site not found', async () => {
      const mockPayload = {
        user_id: 1,
        site_id: 1,
        invite_code: 'ABC123',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(userSiteRepository, 'findOne').mockResolvedValue(null);

      await expect(service.validateInviteToken('valid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeInvite', () => {
    it('should revoke invite successfully', async () => {
      jest.spyOn(userSiteRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.revokeInvite(1, 1);

      expect(userSiteRepository.update).toHaveBeenCalledWith({ user_id: 1, site_id: 1 }, { invite_code: null });
    });
  });

  describe('inviteUser', () => {
    it('should invite user and emit event', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(siteRepository, 'findOne').mockResolvedValue(mockSite);
      jest.spyOn(userSiteRepository, 'findOne').mockResolvedValue(mockUserSite);
      jest.spyOn(userSiteRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('invite-token');

      await service.inviteUser(1, 1);

      expect(eventEmitter.emit).toHaveBeenCalledWith('user.invited', {
        user: mockUser,
        site: mockSite,
        invite_token: 'invite-token',
      });
    });
  });
});
