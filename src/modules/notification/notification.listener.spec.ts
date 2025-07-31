import { Test, TestingModule } from '@nestjs/testing';

import { Comment } from '../comment/comment.entity';
import { COMMENT_PREFIX } from '../comment/comment.entity';
import { Reply } from '../reply/reply.entity';
import { Site } from '../site/site.entity';
import { User, UserRole } from '../user/user.entity';
import { NotificationListener } from './notification.listener';
import { NotificationService } from './notification.service';

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
    roles: [],
    created: new Date(),
    updated: new Date(),
    sites: [],
    comments: [],
    replies: [],
    commentViews: [],
  };

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
    get viewed() {
      return null;
    },
  } as Comment;

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
      get color() {
        return '#00FF00';
      },
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
      jest.spyOn(notificationService, 'extractMentions').mockReturnValue(['mentioned1', 'mentioned2']);

      await listener.handleCommentCreated({
        comment: mockComment,
        site: mockSite,
      });

      expect(notificationService.extractMentions).toHaveBeenCalledWith(mockComment.message);
      expect(notificationService.sendMentionNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'mentioned1',
        mockComment.user,
        mockSite,
        mockComment.message,
        `${mockSite.url}${mockComment.url}#c-${mockComment.uniqid}`,
        'comment',
      );
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'mentioned2',
        mockComment.user,
        mockSite,
        mockComment.message,
        `${mockSite.url}${mockComment.url}#c-${mockComment.uniqid}`,
        'comment',
      );
    });

    it('should not send notifications when no mentions', async () => {
      jest.spyOn(notificationService, 'extractMentions').mockReturnValue([]);

      await listener.handleCommentCreated({
        comment: { ...mockComment, message: 'No mentions here' } as Comment,
        site: mockSite,
      });

      expect(notificationService.sendMentionNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleReplyCreated', () => {
    it('should send notifications for mentions in reply', async () => {
      jest.spyOn(notificationService, 'extractMentions').mockReturnValue(['anotheruser']);

      await listener.handleReplyCreated({
        reply: mockReply,
        comment: mockComment,
        site: mockSite,
      });

      expect(notificationService.extractMentions).toHaveBeenCalledWith(mockReply.message);
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'anotheruser',
        mockReply.user,
        mockSite,
        mockReply.message,
        `${mockSite.url}${mockComment.url}#${COMMENT_PREFIX}${mockComment.uniqid}`,
        'reply',
      );
    });

    it('should only notify mentioned users in reply', async () => {
      jest.spyOn(notificationService, 'extractMentions').mockReturnValue(['anotheruser']);

      await listener.handleReplyCreated({
        reply: mockReply,
        comment: mockComment,
        site: mockSite,
      });

      // Should only notify mentioned users, not comment author
      expect(notificationService.sendMentionNotification).toHaveBeenCalledTimes(1);
      expect(notificationService.sendMentionNotification).toHaveBeenCalledWith(
        'anotheruser',
        mockReply.user,
        mockSite,
        mockReply.message,
        `${mockSite.url}${mockComment.url}#${COMMENT_PREFIX}${mockComment.uniqid}`,
        'reply',
      );
    });

    it('should not double-notify comment author if mentioned', async () => {
      jest.spyOn(notificationService, 'extractMentions').mockReturnValue(['testuser']);

      await listener.handleReplyCreated({
        reply: mockReply,
        comment: mockComment,
        site: mockSite,
      });

      // Should only notify once
      expect(notificationService.sendMentionNotification).toHaveBeenCalledTimes(1);
    });

    it('should not notify anyone if no mentions in reply', async () => {
      jest.spyOn(notificationService, 'extractMentions').mockReturnValue([]);

      await listener.handleReplyCreated({
        reply: mockReply,
        comment: mockComment,
        site: mockSite,
      });

      // Should not notify anyone
      expect(notificationService.sendMentionNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleUserInvited', () => {
    it('should send invite notification', async () => {
      const secretToken = 'secret123';

      await listener.handleUserInvited({
        user: mockUser,
        site: mockSite,
        invite_token: secretToken,
      });

      expect(notificationService.sendInviteNotification).toHaveBeenCalledWith(mockUser, mockSite, secretToken);
    });
  });
});
