import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as cookieSignature from 'cookie-signature';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../src/modules/auth/auth.module';
import { CommentModule } from '../src/modules/comment/comment.module';
import { ScreenshotModule } from '../src/modules/screenshot/screenshot.module';
import { Comment } from '../src/modules/comment/comment.entity';
import { CommentView } from '../src/modules/comment/comment-view.entity';
import { Reply } from '../src/modules/reply/reply.entity';
import { Site } from '../src/modules/site/site.entity';
import { User, UserRole } from '../src/modules/user/user.entity';
import { UserSite } from '../src/modules/user/user-site.entity';
import { TokenService } from '../src/modules/auth/token.service';
import { ScreenshotService } from '../src/modules/screenshot/screenshot.service';

describe('CommentController (e2e)', () => {
  let app: INestApplication;
  let commentRepository: Repository<Comment>;
  let tokenService: TokenService;
  let screenshotService: ScreenshotService;
  let userToken: string;

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

  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    color: '#FF0000',
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

  const mockComment: Comment = {
    id: 1,
    uniqid: 'abc123def4567',
    message: 'Test comment',
    user_id: 1,
    site_id: 1,
    url: 'https://test.com/page',
    details: null,
    reference: null,
    resolved: false,
    screenshot: null,
    created: new Date(),
    updated: new Date(),
    user: mockUser,
    site: mockSite,
    replies: [],
    views: [],
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
              screenshot: {
                baseDir: './test-screenshots',
                baseUrl: 'http://localhost:3000/screenshots',
              },
            }),
          ],
        }),
        EventEmitterModule.forRoot(),
        AuthModule,
        CommentModule,
        ScreenshotModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Comment))
      .useValue({
        find: jest.fn().mockResolvedValue([mockComment]),
        findOne: jest.fn().mockResolvedValue(mockComment),
        create: jest.fn().mockReturnValue(mockComment),
        save: jest.fn().mockResolvedValue(mockComment),
        createQueryBuilder: jest.fn(() => ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockComment]),
        })),
      })
      .overrideProvider(getRepositoryToken(CommentView))
      .useValue({
        save: jest.fn(),
        delete: jest.fn(),
        findOne: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(Reply))
      .useValue({})
      .overrideProvider(getRepositoryToken(Site))
      .useValue({
        findOne: jest.fn().mockResolvedValue(mockSite),
      })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(UserSite))
      .useValue({})
      .compile();

    commentRepository = moduleFixture.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
    siteRepository = moduleFixture.get<Repository<Site>>(
      getRepositoryToken(Site),
    );
    tokenService = moduleFixture.get<TokenService>(TokenService);
    screenshotService = moduleFixture.get<ScreenshotService>(ScreenshotService);

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

    // Generate user token
    userToken = await tokenService.signToken(mockUser, [mockSite.id]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/comments (GET)', () => {
    it('should return all comments for the site', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');

      return request(app.getHttpServer())
        .get('/api/v1/comments')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveLength(1);
          expect((res.body as any[])[0]).toMatchObject({
            id: mockComment.id,
            message: mockComment.message,
            uniqid: mockComment.uniqid,
          });
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/comments')
        .set('Origin', 'https://test.com')
        .expect(401);
    });

    it('should return 403 without origin', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');

      return request(app.getHttpServer())
        .get('/api/v1/comments')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .expect(403);
    });
  });

  describe('/api/v1/comments (POST)', () => {
    it('should create a new comment', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');
      const createDto = {
        message: 'New comment',
        url: 'https://test.com/page',
      };

      jest.spyOn(commentRepository, 'save').mockResolvedValueOnce(mockComment);
      jest
        .spyOn(commentRepository, 'findOne')
        .mockResolvedValueOnce(mockComment);

      return request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: mockComment.id,
            message: mockComment.message,
          });
        });
    });

    it('should handle screenshot upload', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');

      jest
        .spyOn(screenshotService, 'save')
        .mockResolvedValueOnce('abc123def4567.jpg');
      jest
        .spyOn(screenshotService, 'getUrl')
        .mockReturnValue('http://localhost:3000/screenshots/abc123def4567.jpg');

      return request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .field('message', 'Comment with screenshot')
        .field('url', 'https://test.com/page')
        .attach('screenshot', Buffer.from('fake-image-data'), 'screenshot.jpg')
        .expect(201);
    });
  });

  describe('/api/v1/comments/:id (PATCH)', () => {
    it('should update a comment', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');
      const updateDto = {
        id: 1,
        message: 'Updated comment',
      };

      return request(app.getHttpServer())
        .patch('/api/v1/comments/1')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: mockComment.id,
          });
        });
    });
  });

  describe('/api/v1/comments/:id/view (GET)', () => {
    it('should mark comment as viewed', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');

      return request(app.getHttpServer())
        .get('/api/v1/comments/1/view')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('viewed');
          expect(res.body).toHaveProperty('user_id');
        });
    });
  });

  describe('/api/v1/comments/:id/unview (GET)', () => {
    it('should mark comment as unviewed', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');

      return request(app.getHttpServer())
        .get('/api/v1/comments/1/unview')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            viewed: null,
            user_id: mockUser.id,
          });
        });
    });
  });

  describe('/api/v1/comments/view-all (GET)', () => {
    it('should mark all comments as viewed', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');

      return request(app.getHttpServer())
        .get('/api/v1/comments/view-all')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .expect(200);
    });
  });
});
