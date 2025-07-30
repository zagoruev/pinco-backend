import { EmailTemplate, EmailTemplateData } from './base.template';

export interface InvitationTemplateData extends EmailTemplateData {
  siteName: string;
  inviteCode: string;
  appUrl?: string;
}

export class InvitationTemplate extends EmailTemplate<InvitationTemplateData> {
  subject(data: InvitationTemplateData): string {
    return `You've been invited to collaborate ${data.siteName}`;
  }

  html(data: InvitationTemplateData): string {
    const appUrl = data.appUrl;
    const loginUrl = `${appUrl}v1/auth/login?invite=${data.inviteCode}`;

    const content = `
      <h2>Welcome to ${this.escapeHtml(data.siteName)}!</h2>
      
      <p>You've been invited to join <strong>${this.escapeHtml(data.siteName)}</strong> as a collaborator.</p>
      
      <p>Click the button below to set up your account and get started:</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${this.escapeHtml(loginUrl)}" class="button success" style="font-size: 18px; padding: 15px 30px;">
          Accept Invitation
        </a>
      </p>
      
      <p style="color: #666;">
        <strong>Note:</strong> If you didn't expect this invitation, you can safely ignore this email.
      </p>
      
      <hr>
      
      <p style="color: #999; font-size: 12px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${this.escapeHtml(loginUrl)}" style="color: #007bff; word-break: break-all;">
          ${this.escapeHtml(loginUrl)}
        </a>
      </p>
    `;

    const footer = `
      <p>Need help? Contact us at <a href="mailto:support@pinco.com">support@pinco.com</a></p>
    `;

    return this.baseLayout(content, footer);
  }
}
