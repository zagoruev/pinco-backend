import { EmailTemplate, EmailTemplateData } from './base.template';

class TestTemplate extends EmailTemplate<EmailTemplateData> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subject(_data: EmailTemplateData): string {
    return 'Test Subject';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  html(_data: EmailTemplateData): string {
    return '<p>Test HTML</p>';
  }
}

describe('EmailTemplate', () => {
  let template: TestTemplate;

  beforeEach(() => {
    template = new TestTemplate();
  });

  describe('text', () => {
    it('should strip HTML from the html content', () => {
      const data = {};
      const text = template.text(data);
      expect(text).toBe('Test HTML');
    });
  });

  describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
      const html = '<p>Hello <strong>world</strong>!</p>';
      const result = template['stripHtml'](html);
      expect(result).toBe('Hello world!');
    });

    it('should remove style tags and their content', () => {
      const html = '<style>body { color: red; }</style><p>Hello</p>';
      const result = template['stripHtml'](html);
      expect(result).toBe('Hello');
    });

    it('should remove script tags and their content', () => {
      const html = '<script>alert("test");</script><p>Hello</p>';
      const result = template['stripHtml'](html);
      expect(result).toBe('Hello');
    });

    it('should normalize whitespace', () => {
      const html = '<p>Hello     world\n\n\t!</p>';
      const result = template['stripHtml'](html);
      expect(result).toBe('Hello world !');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const text = 'Hello & <world> "test" \'single\'';
      const result = template['escapeHtml'](text);
      expect(result).toBe(
        'Hello &amp; &lt;world&gt; &quot;test&quot; &#039;single&#039;',
      );
    });

    it('should handle empty string', () => {
      const result = template['escapeHtml']('');
      expect(result).toBe('');
    });

    it('should handle text without special characters', () => {
      const text = 'Hello world!';
      const result = template['escapeHtml'](text);
      expect(result).toBe('Hello world!');
    });
  });

  describe('baseLayout', () => {
    it('should generate HTML layout with content', () => {
      const content = '<p>Test content</p>';
      const result = template['baseLayout'](content);

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('<p>Test content</p>');
      expect(result).toContain('<h1>Pinco</h1>');
    });

    it('should include footer when provided', () => {
      const content = '<p>Test content</p>';
      const footer = '<p>Footer text</p>';
      const result = template['baseLayout'](content, footer);

      expect(result).toContain('<div class="footer">');
      expect(result).toContain('<p>Footer text</p>');
    });

    it('should not include footer when not provided', () => {
      const content = '<p>Test content</p>';
      const result = template['baseLayout'](content);

      expect(result).not.toContain('<div class="footer">');
    });
  });
});
