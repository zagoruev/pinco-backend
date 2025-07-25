import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SecretService } from './secret.service';
import { User, UserRole } from '../user/user.entity';
import { UserSite } from '../user/user-site.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let userSiteRepository: Repository<UserSite>;
  let tokenService: TokenService;
  let secretService: SecretService;

  const mockUser: User = {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    color: '#FF0000',
    username: 'admin',
    password: 'hashed-password',
    active: true,
    roles: [UserRole.ADMIN],
    secret_token: null,
    secret_expires: null,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
    replies: [],
    commentViews: [],
  };

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
          provide: getRepositoryToken(UserSite),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            signToken: jest.fn().mockResolvedValue('mock-token'),
          },
        },
        {
          provide: SecretService,
          useValue: {
            validateSecretToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userSiteRepository = module.get<Repository<UserSite>>(getRepositoryToken(UserSite));
    tokenService = module.get<TokenService>(TokenService);
    secretService = module.get<SecretService>(SecretService);
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      const result = await service.validateUser('admin@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@example.com', active: true },
      });
    });

    it('should return null for invalid password', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      const result = await service.validateUser('admin@example.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should return null for commenter role', async () => {
      const commenterUser = { ...mockUser, roles: [UserRole.COMMENTER] };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(commenterUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      const result = await service.validateUser('user@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return token for valid login', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);

      const result = await service.login({ email: 'admin@example.com', password: 'password' });

      expect(result).toEqual({ token: 'mock-token' });
      expect(tokenService.signToken).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException for invalid login', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ email: 'admin@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginWithSecret', () => {
    it('should return token and user for valid secret', async () => {
      jest.spyOn(secretService, 'validateSecretToken').mockResolvedValue(mockUser);
      jest.spyOn(userSiteRepository, 'find').mockResolvedValue([]);

      const result = await service.loginWithSecret('valid-secret');

      expect(result).toEqual({ token: 'mock-token', user: mockUser });
      expect(secretService.validateSecretToken).toHaveBeenCalledWith('valid-secret');
    });

    it('should throw UnauthorizedException for invalid secret', async () => {
      jest.spyOn(secretService, 'validateSecretToken').mockResolvedValue(null);

      await expect(
        service.loginWithSecret('invalid-secret'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});