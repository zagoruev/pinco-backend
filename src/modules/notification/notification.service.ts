import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from './email.service';
import { User } from '../user/user.entity';
import { Comment } from '../comment/comment.entity';
import { Site } from '../site/site.entity';

@Injectable()
export class NotificationService {
  constructor(
    private emailService: EmailService,
    private configService: ConfigService,
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
    // Find mentioned user
    const mentionedUser = await this.userRepository.findOne({
      where: { username: mentionedUsername, active: true },
    });

    if (!mentionedUser) {
      return;
    }

    const subject = `${author.name} mentioned you in a ${type} on ${site.name}`;

    const html = `
      <h2>You were mentioned!</h2>
      <p>${author.name} mentioned you in a ${type} on ${site.name}:</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin: 10px 0;">
        ${this.escapeHtml(content)}
      </blockquote>
      <p><a href="${url}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View ${type}</a></p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        You received this email because someone mentioned you on ${site.name}.
      </p>
    `;

    await this.emailService.sendEmail({
      to: mentionedUser.email,
      subject,
      html,
    });
  }

  async sendInviteNotification(
    user: User,
    site: Site,
    inviteCode: string,
  ): Promise<void> {
    const appUrl = 'https://app.pinco.com';
    const loginUrl = `${appUrl}/auth/login?code=${inviteCode}`;

    const subject = `You've been invited to ${site.name}`;

    const html = `
      <h2>Welcome to ${site.name}!</h2>
      <p>You've been invited to join ${site.name} as a collaborator.</p>
      <p>Click the button below to set up your account and get started:</p>
      <p style="margin: 30px 0;">
        <a href="${loginUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
          Accept Invitation
        </a>
      </p>
      <p style="color: #666;">
        This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
      </p>
      <hr>
      <p style="color: #999; font-size: 12px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${loginUrl}" style="color: #007bff;">${loginUrl}</a>
      </p>
    `;

    await this.emailService.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  extractMentions(text: string): string[] {
    const mentionRegex = /(?:^|[^@\w])@(\w+)(?:\s|$|[^\w])/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
