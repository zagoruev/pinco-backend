import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Repository } from 'typeorm';

import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppConfigService } from '../config/config.service';
import { Site } from '../site/site.entity';
import { UserSite, UserSiteRole } from '../user/user-site.entity';
import { UserSiteService } from '../user/user-site.service';
import { User, UserRole } from '../user/user.entity';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let tokenService: TokenService;
  let userSiteService: UserSiteService;
  let configService: AppConfigService;

  const mockUser = {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    username: 'admin',
    password: 'hashed-password',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            signToken: jest.fn().mockReturnValue('mock-token'),
          },
        },
        {
          provide: UserSiteService,
          useValue: {
            validateInviteToken: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(3600000),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tokenService = module.get<TokenService>(TokenService);
    userSiteService = module.get<UserSiteService>(UserSiteService);
    configService = module.get<AppConfigService>(AppConfigService);
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('admin@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@example.com', active: true },
      });
    });

    it('should return null for invalid password', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('admin@example.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should return null for non-admin/root role', async () => {
      const regularUser = {
        ...mockUser,
        roles: [],
        get color() {
          return '#4C53F1';
        },
      } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(regularUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('user@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return token and user for valid login', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'admin@example.com',
        password: 'password',
      });

      expect(result).toEqual({ token: 'mock-token', user: mockUser });
      expect(tokenService.signToken).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException for invalid login', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login({ email: 'admin@example.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('loginWithInvite', () => {
    const mockSite: Site = {
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
      invite_code: 'valid-invite',
      created: new Date(),
      updated: new Date(),
      user: mockUser,
      site: mockSite,
    } as UserSite;

    it('should return token, user and site for valid invite', async () => {
      jest.spyOn(userSiteService, 'validateInviteToken').mockResolvedValue({ user: mockUser, userSite: mockUserSite });

      const result = await service.loginWithInvite('valid-invite');

      expect(result).toEqual({
        token: 'mock-token',
        user: mockUser,
        site: mockSite,
      });
      expect(userSiteService.validateInviteToken).toHaveBeenCalledWith('valid-invite');
    });

    it('should throw UnauthorizedException for invalid invite', async () => {
      jest.spyOn(userSiteService, 'validateInviteToken').mockResolvedValue({
        user: null as unknown as User,
        userSite: null as unknown as UserSite,
      });

      await expect(service.loginWithInvite('invalid-invite')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('setAuthCookie', () => {
    it('should set auth cookie with correct options', () => {
      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      service.setAuthCookie(mockResponse, 'test-token');

      expect(mockResponse.cookie).toHaveBeenCalledWith('token', 'test-token', {
        httpOnly: true,
        secure: true,
        signed: true,
        sameSite: 'none',
        maxAge: 3600000,
      });
      expect(configService.get).toHaveBeenCalledWith('app.authTokenExpiresIn');
    });
  });
});
