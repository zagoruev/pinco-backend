import { Response } from 'express';

import { Test, TestingModule } from '@nestjs/testing';

import { Site } from '../site/site.entity';
import { User, UserRole } from '../user/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InviteLoginDto } from './dto/invite-login.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let response: Response;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
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

  const mockAuthService = {
    login: jest.fn(),
    loginWithInvite: jest.fn(),
    setAuthCookie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
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

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login with email and password', async () => {
      const loginDto: LoginDto = {
        email: 'admin@example.com',
        password: 'password',
      };

      mockAuthService.login.mockResolvedValue({
        token: 'test-token',
        user: mockUser,
      });

      const result = await controller.login(loginDto, response);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.setAuthCookie).toHaveBeenCalledWith(response, 'test-token');
      expect(result).toEqual({ user: mockUser.id });
    });

    it('should handle invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'invalid@example.com',
        password: 'wrong',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login(loginDto, response)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('loginWithInvite', () => {
    it('should login with valid invite token', async () => {
      const inviteDto: InviteLoginDto = {
        invite: 'valid-invite-token',
      };

      mockAuthService.loginWithInvite.mockResolvedValue({
        token: 'test-token',
        site: mockSite,
      });

      await controller.loginWithInvite(inviteDto, response);

      expect(authService.loginWithInvite).toHaveBeenCalledWith('valid-invite-token');
      expect(authService.setAuthCookie).toHaveBeenCalledWith(response, 'test-token');
      expect(response.redirect).toHaveBeenCalledWith('https://test.com');
    });

    it('should handle invalid invite token', async () => {
      const inviteDto: InviteLoginDto = {
        invite: 'invalid-invite',
      };

      mockAuthService.loginWithInvite.mockRejectedValue(new Error('Invalid invite token'));

      await expect(controller.loginWithInvite(inviteDto, response)).rejects.toThrow('Invalid invite token');
    });
  });

  describe('logout', () => {
    it('should clear cookie and return success message', () => {
      const result = controller.logout(response);

      expect(response.clearCookie).toHaveBeenCalledWith('token');
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});
