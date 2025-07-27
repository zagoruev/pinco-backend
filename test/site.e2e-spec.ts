import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as cookieSignature from 'cookie-signature';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteModule } from '../src/modules/site/site.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Site } from '../src/modules/site/site.entity';
import { User, UserRole } from '../src/modules/user/user.entity';
import { UserSite } from '../src/modules/user/user-site.entity';
import { TokenService } from '../src/modules/auth/token.service';

describe('SiteController (e2e)', () => {
  let app: INestApplication;
  let siteRepository: Repository<Site>;
  let tokenService: TokenService;
  let adminToken: string;

  const mockSite: Site = {
    id: 1,
    name: 'Test Site',
    license: 'LICENSE-123',
    domain: 'test.com',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  };

  const mockAdmin: User = {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin',
    color: '#000000',
    username: 'admin',
    password: 'hashed',
    active: true,
    roles: [UserRole.ADMIN],
    secret_token: null,
    secret_expires: null,
    created: new Date(),
    updated: new Date(),
    sites: [],
    comments: [],
    replies: [],
    commentViews: [],
  };

  beforeAll(async () => {
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
        AuthModule,
        SiteModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Site))
      .useValue({
        find: jest.fn().mockResolvedValue([mockSite]),
        findOne: jest.fn().mockResolvedValue(mockSite),
        create: jest.fn().mockReturnValue(mockSite),
        save: jest.fn().mockResolvedValue(mockSite),
        remove: jest.fn().mockResolvedValue(mockSite),
      })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(UserSite))
      .useValue({})
      .compile();

    siteRepository = moduleFixture.get<Repository<Site>>(
      getRepositoryToken(Site),
    );
    tokenService = moduleFixture.get<TokenService>(TokenService);

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
      jest.spyOn(siteRepository, 'findOne').mockResolvedValueOnce(null);

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
