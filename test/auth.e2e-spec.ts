import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { User, UserRole } from '../src/modules/user/user.entity';
import { UserSite } from '../src/modules/user/user-site.entity';
import { Site } from '../src/modules/site/site.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockUser: User = {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin',
    color: '#000000',
    username: 'admin',
    password: 'hashed',
    active: true,
    roles: [UserRole.ADMIN],
    secret_token: 'valid-secret',
    secret_expires: null,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
    replies: [],
    commentViews: [],
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            app: {
              apiPrefix: 'api/v1',
              cookieSecret: 'test-secret',
              jwtSecret: 'test-jwt-secret',
              jwtExpiresIn: '30d',
            },
          })],
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ token: 'test-token' }),
            loginWithSecret: jest.fn().mockResolvedValue({ token: 'test-token', user: mockUser }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'app.cookieSecret': 'test-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    })
    .compile();

    authService = moduleFixture.get<AuthService>(AuthService);
    
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser('test-secret'));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should login successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'password' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ message: 'Login successful' });
          expect(res.headers['set-cookie']).toBeDefined();
        });
    });
  });

  describe('/api/v1/auth/login (GET)', () => {
    it('should login with secret and redirect', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/login?secret=valid-secret')
        .expect(302)
        .expect('Location', '/');
    });

    it('should return 401 without secret', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/login')
        .expect(401);
    });
  });

  describe('/api/v1/auth/logout (POST)', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(200)
        .expect({ message: 'Logout successful' });
    });
  });
});