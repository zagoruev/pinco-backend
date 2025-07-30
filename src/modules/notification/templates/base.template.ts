export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined;
}

export abstract class EmailTemplate<T extends EmailTemplateData> {
  abstract subject(data: T): string;
  abstract html(data: T): string;

  text(data: T): string {
    return this.stripHtml(this.html(data));
  }

  protected stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  protected escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  protected baseLayout(content: string, footerText?: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 16px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #007bff;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button.success {
      background-color: #28a745;
    }
    .blockquote {
      border-left: 4px solid #007bff;
      padding-left: 20px;
      margin: 20px 0;
      color: #555;
      background-color: #f8f9fa;
      padding: 15px 20px;
      border-radius: 4px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #007bff;
      text-decoration: none;
    }
    hr {
      border: none;
      border-top: 1px solid #e9ecef;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Pinco</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    ${
      footerText
        ? `
    <div class="footer">
      ${footerText}
    </div>
    `
        : ''
    }
  </div>
</body>
</html>
    `.trim();
  }
}
