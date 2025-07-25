import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserRole } from '../user/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let response: Response;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    color: '#000000',
    username: 'testuser',
    password: 'hashed',
    active: true,
    roles: [UserRole.COMMENTER],
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
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            loginWithSecret: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response;
  });

  describe('login', () => {
    it('should set cookie and return success message', async () => {
      jest.spyOn(authService, 'login').mockResolvedValue({ token: 'test-token' });

      const result = await controller.login(
        { email: 'admin@example.com', password: 'password' },
        response,
      );

      expect(result).toEqual({ message: 'Login successful' });
      expect(response.cookie).toHaveBeenCalledWith(
        'auth-token',
        'test-token',
        expect.objectContaining({
          httpOnly: true,
          signed: true,
        }),
      );
    });
  });

  describe('loginWithSecret', () => {
    it('should set cookie and redirect', async () => {
      jest.spyOn(authService, 'loginWithSecret').mockResolvedValue({
        token: 'test-token',
        user: mockUser,
      });

      await controller.loginWithSecret({ secret: 'valid-secret' }, response);

      expect(response.cookie).toHaveBeenCalledWith(
        'auth-token',
        'test-token',
        expect.any(Object),
      );
      expect(response.redirect).toHaveBeenCalledWith('/');
    });

    it('should throw UnauthorizedException if no secret provided', async () => {
      await expect(
        controller.loginWithSecret({ secret: '' }, response),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear cookie and return success message', async () => {
      const result = await controller.logout(response);

      expect(result).toEqual({ message: 'Logout successful' });
      expect(response.clearCookie).toHaveBeenCalledWith('auth-token');
    });
  });
});