import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as cookieSignature from 'cookie-signature';
import { SiteController } from '../src/modules/site/site.controller';
import { SiteService } from '../src/modules/site/site.service';
import { Site } from '../src/modules/site/site.entity';
import { User, UserRole } from '../src/modules/user/user.entity';
import { UserSite } from '../src/modules/user/user-site.entity';
import { CookieAuthGuard } from '../src/common/guards/cookie-auth.guard';
import { TokenService } from '../src/modules/auth/token.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../src/modules/config/config.service';

describe('SiteController (e2e)', () => {
  let app: INestApplication;
  let siteService: SiteService;
  let tokenService: TokenService;
  let adminToken: string;

  // Set environment variables for the test
  process.env.AUTH_TOKEN_EXPIRES_IN = '30d';
  process.env.API_PREFIX = 'api/v1';
  process.env.AUTH_SECRET = 'test-jwt-secret';
  process.env.APP_URL = 'http://localhost:3000';
  process.env.WIDGET_URL = 'http://localhost:3001';

  const mockSite = {
    id: 1,
    name: 'Test Site',
    license: 'LICENSE-123',
    url: 'https://test.com',
    domain: 'test.com',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  } as Site;

  const mockAdmin = {
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
      return '#4C53F1';
    },
  } as User;

  const mockSiteService = {
    findAll: jest.fn().mockResolvedValue([mockSite]),
    findOne: jest.fn().mockResolvedValue(mockSite),
    create: jest.fn().mockResolvedValue(mockSite),
    update: jest.fn().mockResolvedValue(mockSite),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'app.authSecret': 'test-jwt-secret',
        'app.authTokenExpiresIn': 30 * 24 * 60 * 60 * 1000,
      };
      return config[key];
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SiteController],
      providers: [
        {
          provide: SiteService,
          useValue: mockSiteService,
        },
        TokenService,
        JwtService,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(CookieAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    tokenService = moduleFixture.get<TokenService>(TokenService);
    siteService = moduleFixture.get<SiteService>(SiteService);

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser('test-secret'));
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Generate admin token
    adminToken = tokenService.signToken(mockAdmin);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/sites (GET)', () => {
    it('should return all sites for admin', () => {
      const signedToken = cookieSignature.sign(adminToken, 'test-secret');

      return request(app.getHttpServer())
        .get('/api/v1/sites')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toMatchObject({
            id: mockSite.id,
            name: mockSite.name,
            license: mockSite.license,
            domain: mockSite.domain,
            active: mockSite.active,
          });
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer()).get('/api/v1/sites').expect(401);
    });
  });

  describe('/api/v1/sites (POST)', () => {
    it('should create a new site', () => {
      const createDto = {
        name: 'New Site',
        license: 'LICENSE-456',
        domain: 'new.com',
      };

      const signedToken = cookieSignature.sign(adminToken, 'test-secret');

      return request(app.getHttpServer())
        .post('/api/v1/sites')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: mockSite.id,
            name: mockSite.name,
            license: mockSite.license,
            domain: mockSite.domain,
            active: mockSite.active,
          });
        });
    });
  });

  describe('/api/v1/sites/:id (GET)', () => {
    it('should return a site by id', () => {
      const signedToken = cookieSignature.sign(adminToken, 'test-secret');

      return request(app.getHttpServer())
        .get('/api/v1/sites/1')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: mockSite.id,
            name: mockSite.name,
            license: mockSite.license,
            domain: mockSite.domain,
            active: mockSite.active,
          });
        });
    });
  });

  describe('/api/v1/sites/:id (PATCH)', () => {
    it('should update a site', () => {
      const updateDto = { name: 'Updated Site' };
      const signedToken = cookieSignature.sign(adminToken, 'test-secret');

      return request(app.getHttpServer())
        .patch('/api/v1/sites/1')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: mockSite.id,
            name: updateDto.name,
            license: mockSite.license,
            domain: mockSite.domain,
            active: mockSite.active,
          });
        });
    });
  });

  describe('/api/v1/sites/:id (DELETE)', () => {
    it('should delete a site', () => {
      const signedToken = cookieSignature.sign(adminToken, 'test-secret');

      return request(app.getHttpServer())
        .delete('/api/v1/sites/1')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .expect(200);
    });
  });
});
