import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { COMMENT_PREFIX, Comment } from '../comment/comment.entity';
import { Reply } from '../reply/reply.entity';
import { Site } from '../site/site.entity';
import { User } from '../user/user.entity';
import { NotificationService } from './notification.service';

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
  invite_token: string;
}

@Injectable()
export class NotificationListener {
  constructor(private notificationService: NotificationService) {}

  @OnEvent('comment.created')
  async handleCommentCreated(event: CommentCreatedEvent): Promise<void> {
    const { comment, site } = event;

    const mentions = this.notificationService.extractMentions(comment.message);
    const url = `${site.url}${comment.url}#c-${comment.uniqid}`;

    for (const username of mentions) {
      await this.notificationService.sendMentionNotification(
        username,
        comment.user,
        site,
        comment.message,
        url,
        'comment',
      );
    }
  }

  @OnEvent('reply.created')
  async handleReplyCreated(event: ReplyCreatedEvent): Promise<void> {
    const { reply, comment, site } = event;

    const mentions = this.notificationService.extractMentions(reply.message);
    const url = `${site.url}${comment.url}#${COMMENT_PREFIX}${comment.uniqid}`;

    for (const username of mentions) {
      await this.notificationService.sendMentionNotification(username, reply.user, site, reply.message, url, 'reply');
    }
  }

  @OnEvent('user.invited')
  async handleUserInvited(event: UserInvitedEvent): Promise<void> {
    const { user, site, invite_token } = event;

    await this.notificationService.sendInviteNotification(user, site, invite_token);
  }
}
