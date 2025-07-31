import { MentionTemplate, MentionTemplateData } from './mention.template';

describe('MentionTemplate', () => {
  let template: MentionTemplate;

  beforeEach(() => {
    template = new MentionTemplate();
  });

  describe('subject', () => {
    it('should generate correct subject for comment mention', () => {
      const data: MentionTemplateData = {
        authorName: 'John Doe',
        mentionType: 'comment',
        siteName: 'My Site',
        content: 'Hello @user',
        url: 'https://example.com/comment/123',
      };

      const subject = template.subject(data);
      expect(subject).toBe('John Doe mentioned you in a comment on My Site');
    });

    it('should generate correct subject for reply mention', () => {
      const data: MentionTemplateData = {
        authorName: 'Jane Smith',
        mentionType: 'reply',
        siteName: 'Another Site',
        content: 'Thanks @user',
        url: 'https://example.com/reply/456',
      };

      const subject = template.subject(data);
      expect(subject).toBe('Jane Smith mentioned you in a reply on Another Site');
    });
  });

  describe('html', () => {
    it('should generate HTML with escaped content', () => {
      const data: MentionTemplateData = {
        authorName: 'John <script>alert("xss")</script>',
        mentionType: 'comment',
        siteName: 'Site & Co.',
        content: 'Hello @user <strong>test</strong>',
        url: 'https://example.com/comment/123',
      };

      const html = template.html(data);

      expect(html).toContain('You were mentioned!');
      expect(html).toContain('John &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(html).toContain('Site &amp; Co.');
      expect(html).toContain('Hello @user &lt;strong&gt;test&lt;/strong&gt;');
      expect(html).toContain('View comment');
      expect(html).toContain(data.url);
    });

    it('should include proper button styling', () => {
      const data: MentionTemplateData = {
        authorName: 'John Doe',
        mentionType: 'reply',
        siteName: 'My Site',
        content: 'Test content',
        url: 'https://example.com/reply/123',
      };

      const html = template.html(data);

      expect(html).toContain('class="button"');
      expect(html).toContain('View reply');
    });

    it('should include blockquote for content', () => {
      const data: MentionTemplateData = {
        authorName: 'John Doe',
        mentionType: 'comment',
        siteName: 'My Site',
        content: 'This is the mentioned content',
        url: 'https://example.com/comment/123',
      };

      const html = template.html(data);

      expect(html).toContain('<div class="blockquote">');
      expect(html).toContain('This is the mentioned content');
    });
  });

  describe('text', () => {
    it('should generate plain text version', () => {
      const data: MentionTemplateData = {
        authorName: 'John Doe',
        mentionType: 'comment',
        siteName: 'My Site',
        content: 'Hello @user',
        url: 'https://example.com/comment/123',
      };

      const text = template.text(data);

      expect(text).toContain('You were mentioned!');
      expect(text).toContain('John Doe');
      expect(text).toContain('mentioned you in a comment');
      expect(text).toContain('My Site');
      expect(text).toContain('Hello @user');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });
  });
});
