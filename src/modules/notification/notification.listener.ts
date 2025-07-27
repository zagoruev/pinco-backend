import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { Comment } from '../comment/comment.entity';
import { Reply } from '../reply/reply.entity';
import { User } from '../user/user.entity';
import { Site } from '../site/site.entity';

export interface CommentCreatedEvent {
  comment: Comment;
  site: Site;
}

export interface ReplyCreatedEvent {
  reply: Reply;
  comment: Comment;
  site: Site;
}

export interface UserInvitedEvent {
  user: User;
  site: Site;
  secretToken: string;
}

@Injectable()
export class NotificationListener {
  constructor(private notificationService: NotificationService) {}

  @OnEvent('comment.created')
  async handleCommentCreated(event: CommentCreatedEvent): Promise<void> {
    const { comment, site } = event;

    // Extract mentions from comment message
    const mentions = this.notificationService.extractMentions(comment.message);

    // Send notification for each mention
    for (const username of mentions) {
      await this.notificationService.sendMentionNotification(
        username,
        comment.user,
        site,
        comment.message,
        comment.url,
        'comment',
      );
    }
  }

  @OnEvent('reply.created')
  async handleReplyCreated(event: ReplyCreatedEvent): Promise<void> {
    const { reply, comment, site } = event;

    // Extract mentions from reply message
    const mentions = this.notificationService.extractMentions(reply.message);

    // Send notification for each mention
    for (const username of mentions) {
      await this.notificationService.sendMentionNotification(
        username,
        reply.user,
        site,
        reply.message,
        comment.url,
        'reply',
      );
    }

    // Also notify the comment author if they weren't mentioned
    if (
      comment.user_id !== reply.user_id &&
      !mentions.includes(comment.user.username)
    ) {
      await this.notificationService.sendMentionNotification(
        comment.user.username,
        reply.user,
        site,
        reply.message,
        comment.url,
        'reply',
      );
    }
  }

  @OnEvent('user.invited')
  async handleUserInvited(event: UserInvitedEvent): Promise<void> {
    const { user, site, secretToken } = event;

    await this.notificationService.sendInviteNotification(
      user,
      site,
      secretToken,
    );
  }
}
