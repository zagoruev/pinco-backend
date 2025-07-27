import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as cookieSignature from 'cookie-signature';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReplyModule } from '../src/modules/reply/reply.module';
import { Reply } from '../src/modules/reply/reply.entity';
import { Comment } from '../src/modules/comment/comment.entity';
import { Site } from '../src/modules/site/site.entity';
import { User, UserRole } from '../src/modules/user/user.entity';
import { UserSite } from '../src/modules/user/user-site.entity';
import { TokenService } from '../src/modules/auth/token.service';
import { AuthModule } from '../src/modules/auth/auth.module';

describe('ReplyController (e2e)', () => {
  let app: INestApplication;
  let replyRepository: Repository<Reply>;
  let commentRepository: Repository<Comment>;
  let tokenService: TokenService;
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
    roles: [],
    secret_token: null,
    secret_expires: null,
    created: new Date(),
    updated: new Date(),
    sites: [],
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

  const mockReply: Reply = {
    id: 1,
    comment_id: 1,
    user_id: 1,
    message: 'Test reply',
    created: new Date(),
    updated: new Date(),
    comment: mockComment,
    user: mockUser,
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
        EventEmitterModule.forRoot(),
        AuthModule,
        ReplyModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Reply))
      .useValue({
        createQueryBuilder: jest.fn(() => ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockReply]),
          getOne: jest.fn().mockResolvedValue(mockReply),
        })),
        create: jest.fn().mockReturnValue(mockReply),
        save: jest.fn().mockResolvedValue(mockReply),
        findOne: jest.fn().mockResolvedValue(mockReply),
      })
      .overrideProvider(getRepositoryToken(Comment))
      .useValue({
        findOne: jest.fn().mockResolvedValue(mockComment),
      })
      .overrideProvider(getRepositoryToken(Site))
      .useValue({
        findOne: jest.fn().mockResolvedValue(mockSite),
      })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(UserSite))
      .useValue({})
      .compile();

    replyRepository = moduleFixture.get<Repository<Reply>>(
      getRepositoryToken(Reply),
    );
    commentRepository = moduleFixture.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
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

    // Generate user token
    userToken = await tokenService.signToken(mockUser, [mockSite.id]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/replies (GET)', () => {
    it('should return all replies for the site', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');

      return request(app.getHttpServer())
        .get('/api/v1/replies')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toMatchObject({
            id: mockReply.id,
            comment_id: mockReply.comment_id,
            message: mockReply.message,
            user_id: mockReply.user_id,
          });
          expect(res.body[0]).toHaveProperty('created');
          expect(res.body[0]).toHaveProperty('updated');
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/replies')
        .set('Origin', 'https://test.com')
        .expect(401);
    });

    it('should return 403 without origin', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');

      return request(app.getHttpServer())
        .get('/api/v1/replies')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .expect(403);
    });
  });

  describe('/api/v1/replies (POST)', () => {
    it('should create a new reply', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');
      const createDto = {
        comment_id: 1,
        message: 'New reply',
      };

      jest
        .spyOn(commentRepository, 'findOne')
        .mockResolvedValueOnce(mockComment);
      jest.spyOn(replyRepository, 'save').mockResolvedValueOnce(mockReply);
      jest.spyOn(replyRepository, 'findOne').mockResolvedValueOnce(mockReply);

      return request(app.getHttpServer())
        .post('/api/v1/replies')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: mockReply.id,
            comment_id: mockReply.comment_id,
            message: mockReply.message,
            user_id: mockReply.user_id,
          });
        });
    });

    it('should return 400 if comment_id is missing', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');
      const createDto = {
        message: 'New reply',
      };

      return request(app.getHttpServer())
        .post('/api/v1/replies')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .send(createDto)
        .expect(400);
    });

    it('should return 400 if message is missing', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');
      const createDto = {
        comment_id: 1,
      };

      return request(app.getHttpServer())
        .post('/api/v1/replies')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .send(createDto)
        .expect(400);
    });
  });

  describe('/api/v1/replies/:id (PATCH)', () => {
    it('should update a reply', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');
      const updateDto = {
        id: 1,
        message: 'Updated reply',
      };

      return request(app.getHttpServer())
        .patch('/api/v1/replies/1')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: mockReply.id,
            comment_id: mockReply.comment_id,
            user_id: mockReply.user_id,
          });
        });
    });

    it('should return 400 if id is missing from dto', () => {
      const signedToken = cookieSignature.sign(userToken, 'test-secret');
      const updateDto = {
        message: 'Updated reply',
      };

      return request(app.getHttpServer())
        .patch('/api/v1/replies/1')
        .set('Cookie', [`auth-token=s:${signedToken}`])
        .set('Origin', 'https://test.com')
        .send(updateDto)
        .expect(400);
    });
  });
});
