import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Comment } from '../comment/comment.entity';
import { AppConfigService } from '../config/config.service';
import { Site } from '../site/site.entity';
import { User } from '../user/user.entity';
import { EmailService } from './email.service';
import { InvitationTemplate, MentionTemplate } from './templates';

@Injectable()
export class NotificationService {
  private mentionTemplate = new MentionTemplate();
  private invitationTemplate = new InvitationTemplate();

  constructor(
    private emailService: EmailService,
    private configService: AppConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendMentionNotification(
    mentionedUsername: string,
    author: User,
    site: Site,
    content: string,
    url: string,
    type: 'comment' | 'reply',
  ): Promise<void> {
    const mentionedUser = await this.userRepository.findOne({
      where: { username: mentionedUsername, active: true },
    });

    if (!mentionedUser) {
      return;
    }

    await this.emailService.sendWithTemplate(mentionedUser.email, this.mentionTemplate, {
      authorName: author.name,
      mentionType: type,
      siteName: site.name,
      content,
      url,
    });
  }

  async sendInviteNotification(user: User, site: Site, inviteCode: string): Promise<void> {
    const appUrl = `${this.configService.get('app.url')}/${this.configService.get('app.apiPrefix')}`;

    await this.emailService.sendWithTemplate(user.email, this.invitationTemplate, {
      siteName: site.name,
      inviteCode,
      appUrl,
    });
  }

  extractMentions(text: string): string[] {
    const mentionRegex = /(?:^|[^@\w])@(\w+)(?:\s|$|[^\w])/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)];
  }
}
