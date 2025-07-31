import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigService } from '../config/config.service';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { User, UserRole } from '../user/user.entity';
import { Site } from '../site/site.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let emailService: EmailService;
  let userRepository: Repository<User>;

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    get color() {
      return '#4C53F1';
    },
    username: 'testuser',
    password: 'hashed',
    active: true,
    roles: [UserRole.ADMIN],
    created: new Date(),
    updated: new Date(),
    sites: [],
    userSites: [],
    comments: [],
    replies: [],
    commentViews: [],
  } as User;

  const mockAuthor = {
    ...mockUser,
    id: 2,
    email: 'author@example.com',
    name: 'Author User',
    username: 'author',
    get color() {
      return '#4C53F1';
    },
  } as User;

  const mockSite: Site = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: EmailService,
          useValue: {
            sendWithTemplate: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'app.url') return 'https://app.pinco.com';
              if (key === 'app.apiPrefix') return 'api';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    emailService = module.get<EmailService>(EmailService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMentionNotification', () => {
    it('should send email when mentioned user is found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await service.sendMentionNotification(
        'testuser',
        mockAuthor,
        mockSite,
        'Hello @testuser, check this out!',
        'https://test.com/comments/1',
        'comment',
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser', active: true },
      });

      expect(emailService.sendWithTemplate).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(Object),
        {
          authorName: 'Author User',
          mentionType: 'comment',
          siteName: 'Test Site',
          content: 'Hello @testuser, check this out!',
          url: 'https://test.com/comments/1',
        },
      );
    });

    it('should not send email when mentioned user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await service.sendMentionNotification(
        'nonexistent',
        mockAuthor,
        mockSite,
        'Hello @nonexistent',
        'https://test.com/comments/1',
        'comment',
      );

      expect(emailService.sendWithTemplate).not.toHaveBeenCalled();
    });
  });

  describe('sendInviteNotification', () => {
    it('should send invite email with correct link', async () => {
      const secretToken = 'secret123';

      await service.sendInviteNotification(mockUser, mockSite, secretToken);

      expect(emailService.sendWithTemplate).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(Object),
        {
          siteName: 'Test Site',
          inviteCode: 'secret123',
          appUrl: 'https://app.pinco.com/api',
        },
      );
    });
  });

  describe('extractMentions', () => {
    it('should extract single mention', () => {
      const text = 'Hello @user1!';
      const mentions = service.extractMentions(text);
      expect(mentions).toEqual(['user1']);
    });

    it('should extract multiple mentions', () => {
      const text = '@user1 and @user2, please check this. Also @user3';
      const mentions = service.extractMentions(text);
      expect(mentions).toEqual(['user1', 'user2', 'user3']);
    });

    it('should remove duplicate mentions', () => {
      const text = 'Hey @user1, @user2, and @user1 again';
      const mentions = service.extractMentions(text);
      expect(mentions).toEqual(['user1', 'user2']);
    });

    it('should handle text with no mentions', () => {
      const text = 'No mentions here!';
      const mentions = service.extractMentions(text);
      expect(mentions).toEqual([]);
    });

    it('should handle email addresses correctly', () => {
      const text = 'Contact me at email@example.com';
      const mentions = service.extractMentions(text);
      expect(mentions).toEqual([]);
    });
  });
});
