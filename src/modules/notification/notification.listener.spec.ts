import { Test, TestingModule } from '@nestjs/testing';
import { NotificationListener } from './notification.listener';
import { NotificationService } from './notification.service';
import { User, UserRole } from '../user/user.entity';
import { Site } from '../site/site.entity';
import { Comment } from '../comment/comment.entity';
import { Reply } from '../reply/reply.entity';

describe('NotificationListener', () => {
  let listener: NotificationListener;
  let notificationService: NotificationService;

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

  const mockComment: Comment = {
    id: 1,
    uniqid: 'abc123def4567',
    message: 'Hello @mentioned1 and @mentioned2',
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
    user_id: 2,
    message: 'Reply with @anotheruser mention',
    created: new Date(),
    updated: new Date(),
    comment: mockComment,
    user: {
      ...mockUser,
      id: 2,
      username: 'replyuser',
      email: 'reply@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationListener,
        {
          provide: NotificationService,
          useValue: {
            extractMentions: jest.fn(),
            sendMentionNotification: jest.fn(),
            sendInviteNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<NotificationListener>(NotificationListener);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleCommentCreated', () => {
    it('should send notifications for all mentions', async () => {
      jest
        .spyOn(notificationService, 'extractMentions')
        .mockReturnValue(['mentioned1', 'mentioned2']);

      await listener.handleCommentCreated({
        comment: mockComment,
        site: mockSite,
      });

      expect(notificationService.extractMentions).toHaveBeenCalledWith(
        mockComment.message,
      );
      expect(notificationService.sendMentionNotification).toHaveBeenCalledTimes(
        2,
      );
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'mentioned1',
        mockComment.user,
        mockSite,
        mockComment.message,
        mockComment.url,
        'comment',
      );
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'mentioned2',
        mockComment.user,
        mockSite,
        mockComment.message,
        mockComment.url,
        'comment',
      );
    });

    it('should not send notifications when no mentions', async () => {
      jest.spyOn(notificationService, 'extractMentions').mockReturnValue([]);

      await listener.handleCommentCreated({
        comment: { ...mockComment, message: 'No mentions here' },
        site: mockSite,
      });

      expect(
        notificationService.sendMentionNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('handleReplyCreated', () => {
    it('should send notifications for mentions in reply', async () => {
      jest
        .spyOn(notificationService, 'extractMentions')
        .mockReturnValue(['anotheruser']);

      await listener.handleReplyCreated({
        reply: mockReply,
        comment: mockComment,
        site: mockSite,
      });

      expect(notificationService.extractMentions).toHaveBeenCalledWith(
        mockReply.message,
      );
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'anotheruser',
        mockReply.user,
        mockSite,
        mockReply.message,
        mockComment.url,
        'reply',
      );
    });

    it('should notify comment author when not mentioned', async () => {
      jest
        .spyOn(notificationService, 'extractMentions')
        .mockReturnValue(['anotheruser']);

      await listener.handleReplyCreated({
        reply: mockReply,
        comment: mockComment,
        site: mockSite,
      });

      // Should notify mentioned users and comment author
      expect(notificationService.sendMentionNotification).toHaveBeenCalledTimes(
        2,
      );

      // Check notification to comment author
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        mockComment.user.username,
        mockReply.user,
        mockSite,
        mockReply.message,
        mockComment.url,
        'reply',
      );
    });

    it('should not double-notify comment author if mentioned', async () => {
      jest
        .spyOn(notificationService, 'extractMentions')
        .mockReturnValue(['testuser']);

      await listener.handleReplyCreated({
        reply: mockReply,
        comment: mockComment,
        site: mockSite,
      });

      // Should only notify once
      expect(notificationService.sendMentionNotification).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should not notify comment author if they are replying', async () => {
      jest.spyOn(notificationService, 'extractMentions').mockReturnValue([]);

      await listener.handleReplyCreated({
        reply: { ...mockReply, user_id: mockComment.user_id },
        comment: mockComment,
        site: mockSite,
      });

      // Should not notify anyone
      expect(
        notificationService.sendMentionNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('handleUserInvited', () => {
    it('should send invite notification', async () => {
      const secretToken = 'secret123';

      await listener.handleUserInvited({
        user: mockUser,
        site: mockSite,
        secretToken,
      });

      expect(notificationService.sendInviteNotification).toHaveBeenCalledWith(
        mockUser,
        mockSite,
        secretToken,
      );
    });
  });
});
