import screenshotConfig from './screenshot.config';

describe('Screenshot Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return screenshot configuration with environment values', () => {
    process.env.SCREENSHOT_SERVE_LOCAL = 'true';
    process.env.SCREENSHOT_BASE_DIR = '/var/app/screenshots';
    process.env.SCREENSHOT_BASE_URL = 'https://cdn.example.com/screenshots';

    const config = screenshotConfig();

    expect(config).toEqual({
      serveLocal: true,
      baseDir: '/var/app/screenshots',
      baseUrl: 'https://cdn.example.com/screenshots',
    });
  });

  it('should return default values when environment variables are not set', () => {
    delete process.env.SCREENSHOT_SERVE_LOCAL;
    delete process.env.SCREENSHOT_BASE_DIR;
    delete process.env.SCREENSHOT_BASE_URL;

    const config = screenshotConfig();

    expect(config).toEqual({
      serveLocal: false,
      baseDir: './screenshots',
      baseUrl: 'http://localhost:3000/screenshots',
    });
  });

  it('should handle serveLocal as false when not "true"', () => {
    process.env.SCREENSHOT_SERVE_LOCAL = 'false';

    const config = screenshotConfig();

    expect(config.serveLocal).toBe(false);
  });

  it('should handle serveLocal as false for any non-"true" value', () => {
    process.env.SCREENSHOT_SERVE_LOCAL = 'yes';

    const config = screenshotConfig();

    expect(config.serveLocal).toBe(false);
  });

  it('should handle empty string environment variables and use defaults', () => {
    process.env.SCREENSHOT_SERVE_LOCAL = '';
    process.env.SCREENSHOT_BASE_DIR = '';
    process.env.SCREENSHOT_BASE_URL = '';

    const config = screenshotConfig();

    expect(config).toEqual({
      serveLocal: false,
      baseDir: './screenshots',
      baseUrl: 'http://localhost:3000/screenshots',
    });
  });

  it('should handle partial configuration', () => {
    process.env.SCREENSHOT_SERVE_LOCAL = 'true';
    process.env.SCREENSHOT_BASE_DIR = '/custom/path';
    // Leave baseUrl to use default
    delete process.env.SCREENSHOT_BASE_URL;

    const config = screenshotConfig();

    expect(config).toEqual({
      serveLocal: true,
      baseDir: '/custom/path',
      baseUrl: 'http://localhost:3000/screenshots',
    });
  });

  it('should handle different base URLs', () => {
    process.env.SCREENSHOT_BASE_URL =
      'https://s3.amazonaws.com/bucket/screenshots';

    const config = screenshotConfig();

    expect(config.baseUrl).toBe('https://s3.amazonaws.com/bucket/screenshots');
  });

  it('should handle relative and absolute paths for baseDir', () => {
    // Test relative path
    process.env.SCREENSHOT_BASE_DIR = './uploads/screenshots';
    let config = screenshotConfig();
    expect(config.baseDir).toBe('./uploads/screenshots');

    // Test absolute path
    process.env.SCREENSHOT_BASE_DIR = '/opt/app/data/screenshots';
    config = screenshotConfig();
    expect(config.baseDir).toBe('/opt/app/data/screenshots');
  });
});
