import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { AppConfigService } from '../config/config.service';
import { EmailTemplate, EmailTemplateData } from './templates';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: AppConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('email.host'),
      port: this.configService.get('email.port'),
      secure: this.configService.get('email.secure'),
      auth: {
        user: this.configService.get('email.user'),
        pass: this.configService.get('email.pass'),
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const from = this.configService.get('email.from');

    await (this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || this.stripHtml(options.html),
    }) as Promise<void>);
  }

  async sendWithTemplate<T extends EmailTemplateData>(
    to: string,
    template: EmailTemplate<T>,
    data: T,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
