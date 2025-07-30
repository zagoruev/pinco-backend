import { EmailTemplate, EmailTemplateData } from './base.template';

export interface MentionTemplateData extends EmailTemplateData {
  authorName: string;
  mentionType: 'comment' | 'reply';
  siteName: string;
  content: string;
  url: string;
}

export class MentionTemplate extends EmailTemplate<MentionTemplateData> {
  subject(data: MentionTemplateData): string {
    return `${data.authorName} mentioned you in a ${data.mentionType} on ${data.siteName}`;
  }

  html(data: MentionTemplateData): string {
    const content = `
      <h2>You were mentioned!</h2>
      <p><strong>${this.escapeHtml(data.authorName)}</strong> mentioned you in a ${data.mentionType} on <strong>${this.escapeHtml(data.siteName)}</strong>:</p>
      
      <div class="blockquote">
        ${this.escapeHtml(data.content)}
      </div>
      
      <p style="text-align: center;">
        <a href="${this.escapeHtml(data.url)}" class="button">View ${data.mentionType}</a>
      </p>
      
      <hr>
      
      <p style="color: #666; font-size: 14px;">
        You received this email because someone mentioned you on ${this.escapeHtml(data.siteName)}.
      </p>
    `;

    return this.baseLayout(content);
  }
}
