import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService, TokenPayload } from './token.service';
import { AppConfigService } from '../config/config.service';
import { User, UserRole } from '../user/user.entity';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;
  let configService: AppConfigService;

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

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'app.authSecret': 'test-secret',
        'app.authTokenExpiresIn': 30 * 24 * 60 * 60 * 1000, // 30 days
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<AppConfigService>(AppConfigService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signToken', () => {
    it('should sign a token with user data', () => {
      const result = service.signToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          roles: mockUser.roles,
        },
        {
          secret: 'test-secret',
          expiresIn: 30 * 24 * 60 * 60 * 1000,
        },
      );
      expect(result).toBe('mock-jwt-token');
    });

    it('should get config values for signing', () => {
      service.signToken(mockUser);

      expect(configService.get).toHaveBeenCalledWith('app.authSecret');
      expect(configService.get).toHaveBeenCalledWith('app.authTokenExpiresIn');
    });
  });

  describe('verifyToken', () => {
    it('should verify and return token payload', () => {
      const mockPayload: TokenPayload = {
        id: 1,
        email: 'user@example.com',
        roles: ['ADMIN'],
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = service.verifyToken('valid-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
      expect(result).toEqual(mockPayload);
      expect(result.id).toBe(1);
    });

    it('should convert id to number', () => {
      const mockPayload = {
        id: '1',
        email: 'user@example.com',
        roles: ['ADMIN'],
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = service.verifyToken('valid-token');

      expect(result.id).toBe(1);
      expect(typeof result.id).toBe('number');
    });

    it('should throw UnauthorizedException for invalid token without id', () => {
      const mockPayload = {
        email: 'user@example.com',
        roles: ['ADMIN'],
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      expect(() => service.verifyToken('invalid-token')).toThrow(
        UnauthorizedException,
      );
      expect(() => service.verifyToken('invalid-token')).toThrow(
        'Invalid authentication token',
      );
    });

    it('should throw error if JWT verification fails', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      expect(() => service.verifyToken('invalid-token')).toThrow(
        'JWT verification failed',
      );
    });

    it('should get config values for verification', () => {
      const mockPayload: TokenPayload = {
        id: 1,
        email: 'user@example.com',
        roles: ['ADMIN'],
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      service.verifyToken('valid-token');

      expect(configService.get).toHaveBeenCalledWith('app.authSecret');
    });
  });
});
