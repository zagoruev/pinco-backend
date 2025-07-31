import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { Site } from '../src/modules/site/site.entity';
import { User, UserRole } from '../src/modules/user/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockUser: User = {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin',
    username: 'admin',
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
      return '#000000';
    },
  } as User;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              app: {
                apiPrefix: 'api/v1',
                jwtSecret: 'test-jwt-secret',
                jwtExpiresIn: '30d',
              },
            }),
          ],
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ token: 'test-token', user: mockUser }),
            loginWithInvite: jest.fn().mockResolvedValue({
              token: 'test-token',
              site: { url: 'https://test.com' },
            }),
            setAuthCookie: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'app.jwtSecret': 'test-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    const authService = moduleFixture.get<AuthService>(AuthService);

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
          expect(res.body).toEqual({ user: 1 });
          expect(res.headers['set-cookie']).toBeDefined();
        });
    });
  });

  describe('/api/v1/auth/login (GET)', () => {
    it('should login with secret and redirect', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/login?invite=valid-invite')
        .expect(302)
        .expect('Location', 'https://test.com');
    });

    it('should return 400 without invite', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/login').expect(400);
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
