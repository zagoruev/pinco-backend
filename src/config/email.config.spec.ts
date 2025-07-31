import emailConfig from './email.config';

describe('Email Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return email configuration with environment values', () => {
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'user@gmail.com';
    process.env.SMTP_PASS = 'app-specific-password';
    process.env.EMAIL_FROM = 'noreply@mycompany.com';

    const config = emailConfig();

    expect(config).toEqual({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: 'user@gmail.com',
      pass: 'app-specific-password',
      from: 'noreply@mycompany.com',
    });
  });

  it('should return default values when environment variables are not set', () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM;

    const config = emailConfig();

    expect(config).toEqual({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from: 'noreply@pinco.com',
    });
  });

  it('should handle secure as false when not "true"', () => {
    process.env.SMTP_SECURE = 'false';

    const config = emailConfig();

    expect(config.secure).toBe(false);
  });

  it('should handle secure as false for any non-"true" value', () => {
    process.env.SMTP_SECURE = 'yes';

    const config = emailConfig();

    expect(config.secure).toBe(false);
  });

  it('should parse port as integer', () => {
    process.env.SMTP_PORT = '25';

    const config = emailConfig();

    expect(config.port).toBe(25);
    expect(typeof config.port).toBe('number');
  });

  it('should handle empty string environment variables and use defaults', () => {
    process.env.SMTP_HOST = '';
    process.env.SMTP_PORT = '';
    process.env.SMTP_SECURE = '';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASS = '';
    process.env.EMAIL_FROM = '';

    const config = emailConfig();

    expect(config).toEqual({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from: 'noreply@pinco.com',
    });
  });

  it('should handle partial configuration', () => {
    process.env.SMTP_HOST = 'mail.custom.com';
    process.env.SMTP_USER = 'sender@custom.com';
    // Leave other values to use defaults
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM;

    const config = emailConfig();

    expect(config).toEqual({
      host: 'mail.custom.com',
      port: 587,
      secure: false,
      user: 'sender@custom.com',
      pass: '',
      from: 'noreply@pinco.com',
    });
  });
});
