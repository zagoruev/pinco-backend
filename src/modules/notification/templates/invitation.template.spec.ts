import { InvitationTemplate, InvitationTemplateData } from './invitation.template';

describe('InvitationTemplate', () => {
  let template: InvitationTemplate;

  beforeEach(() => {
    template = new InvitationTemplate();
  });

  describe('subject', () => {
    it('should generate correct subject', () => {
      const data: InvitationTemplateData = {
        siteName: 'My Awesome Site',
        inviteCode: 'abc123',
      };

      const subject = template.subject(data);
      expect(subject).toBe("You've been invited to collaborate My Awesome Site");
    });

    it('should handle special characters in site name', () => {
      const data: InvitationTemplateData = {
        siteName: 'Site & Co.',
        inviteCode: 'xyz789',
      };

      const subject = template.subject(data);
      expect(subject).toBe("You've been invited to collaborate Site & Co.");
    });
  });

  describe('html', () => {
    it('should generate HTML with default app URL', () => {
      const data: InvitationTemplateData = {
        siteName: 'Test Site',
        inviteCode: 'test123',
      };

      const html = template.html(data);

      expect(html).toContain('Welcome to Test Site!');
      expect(html).toContain('undefined/v1/auth/login?invite=test123');
      expect(html).toContain('Accept Invitation');
      expect(html).not.toContain('This invitation link will expire in 7 days');
    });

    it('should use custom app URL when provided', () => {
      const data: InvitationTemplateData = {
        siteName: 'Test Site',
        inviteCode: 'test123',
        appUrl: 'https://custom.pinco.com',
      };

      const html = template.html(data);

      expect(html).toContain('https://custom.pinco.com/v1/auth/login?invite=test123');
      expect(html).not.toContain('https://app.pinco.com');
    });

    it('should escape HTML in site name', () => {
      const data: InvitationTemplateData = {
        siteName: '<script>alert("xss")</script>',
        inviteCode: 'safe123',
      };

      const html = template.html(data);

      expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(html).not.toContain('<script>alert("xss")</script>');
    });

    it('should include success button styling', () => {
      const data: InvitationTemplateData = {
        siteName: 'Test Site',
        inviteCode: 'test123',
      };

      const html = template.html(data);

      expect(html).toContain('class="button success"');
      expect(html).toContain('font-size: 18px');
      expect(html).toContain('padding: 15px 30px');
    });

    it('should include footer with support email', () => {
      const data: InvitationTemplateData = {
        siteName: 'Test Site',
        inviteCode: 'test123',
      };

      const html = template.html(data);

      expect(html).toContain('help@pinco.works');
      expect(html).toContain('Need help?');
    });

    it('should include fallback link', () => {
      const data: InvitationTemplateData = {
        siteName: 'Test Site',
        inviteCode: 'test123',
      };

      const html = template.html(data);

      expect(html).toContain("If the button doesn't work");
      expect(html).toContain('word-break: break-all');
    });
  });

  describe('text', () => {
    it('should generate plain text version', () => {
      const data: InvitationTemplateData = {
        siteName: 'Test Site',
        inviteCode: 'test123',
      };

      const text = template.text(data);

      expect(text).toContain('Welcome to Test Site!');
      expect(text).toContain("You've been invited to join Test Site as a collaborator");
      expect(text).toContain('undefined/v1/auth/login?invite=test123');
      expect(text).not.toContain('This invitation link will expire in 7 days');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });
  });
});
