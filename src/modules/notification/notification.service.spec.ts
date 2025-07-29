import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { User, UserRole } from '../user/user.entity';
import { Site } from '../site/site.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let emailService: EmailService;
  let userRepository: Repository<User>;

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

  const mockAuthor: User = {
    ...mockUser,
    id: 2,
    email: 'author@example.com',
    name: 'Author User',
    username: 'author',
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
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

      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Author User mentioned you in a comment on Test Site',
        html: expect.stringContaining('Author User mentioned you in a comment'),
      });
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

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should escape HTML in content', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await service.sendMentionNotification(
        'testuser',
        mockAuthor,
        mockSite,
        '<script>alert("xss")</script>',
        'https://test.com/comments/1',
        'reply',
      );

      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Author User mentioned you in a reply on Test Site',
        html: expect.stringContaining(
          '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        ),
      });
    });
  });

  describe('sendInviteNotification', () => {
    it('should send invite email with correct link', async () => {
      const secretToken = 'secret123';

      await service.sendInviteNotification(mockUser, mockSite, secretToken);

      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: "You've been invited to Test Site",
        html: expect.stringContaining(
          'https://app.pinco.com/auth/login?token=secret123',
        ),
      });
    });

    it('should include site name in email', async () => {
      await service.sendInviteNotification(mockUser, mockSite, 'token123');

      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: "You've been invited to Test Site",
        html: expect.stringContaining('Welcome to Test Site!'),
      });
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
