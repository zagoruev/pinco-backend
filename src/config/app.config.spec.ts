import appConfig from './app.config';

// Mock parse-duration
jest.mock('parse-duration', () => ({
  __esModule: true,
  default: jest.fn((value: string) => {
    // Simple mock implementation
    if (value === '7d') return 7 * 24 * 60 * 60 * 1000;
    if (value === '1h') return 60 * 60 * 1000;
    if (value === '30m') return 30 * 60 * 1000;
    return 86400000; // default 1 day
  }),
}));

describe('App Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return app configuration with all required values', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.APP_URL = 'https://api.example.com';
    process.env.API_PREFIX = 'api';
    process.env.AUTH_SECRET = 'test-secret';
    process.env.AUTH_TOKEN_EXPIRES_IN = '7d';
    process.env.WIDGET_URL = 'https://widget.example.com';
    process.env.WIDGET_DEV_URL = 'http://localhost:5173';
    process.env.WIDGET_IS_DEV = 'false';

    const config = appConfig();

    expect(config).toEqual({
      isDev: true,
      port: 3000,
      url: 'https://api.example.com',
      apiPrefix: 'api',
      authSecret: 'test-secret',
      authTokenExpiresIn: 7 * 24 * 60 * 60 * 1000,
      widgetUrl: 'https://widget.example.com',
      widgetDevUrl: 'http://localhost:5173',
      widgetIsDev: false,
    });
  });

  it('should handle widgetIsDev as true when WIDGET_IS_DEV is true and WIDGET_DEV_URL exists', () => {
    process.env.PORT = '3000';
    process.env.APP_URL = 'https://api.example.com';
    process.env.API_PREFIX = 'api';
    process.env.AUTH_SECRET = 'test-secret';
    process.env.AUTH_TOKEN_EXPIRES_IN = '1h';
    process.env.WIDGET_URL = 'https://widget.example.com';
    process.env.WIDGET_DEV_URL = 'http://localhost:5173';
    process.env.WIDGET_IS_DEV = 'true';

    const config = appConfig();

    expect(config.widgetIsDev).toBe('http://localhost:5173');
  });

  it('should handle widgetIsDev as undefined when WIDGET_IS_DEV is true but no WIDGET_DEV_URL', () => {
    process.env.PORT = '3000';
    process.env.APP_URL = 'https://api.example.com';
    process.env.API_PREFIX = 'api';
    process.env.AUTH_SECRET = 'test-secret';
    process.env.AUTH_TOKEN_EXPIRES_IN = '30m';
    process.env.WIDGET_URL = 'https://widget.example.com';
    process.env.WIDGET_IS_DEV = 'true';
    delete process.env.WIDGET_DEV_URL;

    const config = appConfig();

    expect(config.widgetIsDev).toBeUndefined();
  });

  it('should parse different port numbers', () => {
    process.env.PORT = '8080';
    process.env.APP_URL = 'https://api.example.com';
    process.env.API_PREFIX = 'api';
    process.env.AUTH_SECRET = 'test-secret';
    process.env.AUTH_TOKEN_EXPIRES_IN = '7d';
    process.env.WIDGET_URL = 'https://widget.example.com';

    const config = appConfig();

    expect(config.port).toBe(8080);
  });

  it('should handle missing optional WIDGET_DEV_URL', () => {
    process.env.PORT = '3000';
    process.env.APP_URL = 'https://api.example.com';
    process.env.API_PREFIX = 'api';
    process.env.AUTH_SECRET = 'test-secret';
    process.env.AUTH_TOKEN_EXPIRES_IN = '7d';
    process.env.WIDGET_URL = 'https://widget.example.com';
    delete process.env.WIDGET_DEV_URL;

    const config = appConfig();

    expect(config.widgetDevUrl).toBeUndefined();
  });
});
