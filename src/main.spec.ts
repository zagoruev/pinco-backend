import { bootstrap } from './main';

// Mock all dependencies
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
  Reflector: jest.fn(() => ({ get: jest.fn() })),
}));

jest.mock('@nestjs/common', () => ({
  VersioningType: {
    URI: 'URI',
  },
  ClassSerializerInterceptor: jest.fn(() => ({ intercept: jest.fn() })),
}));

jest.mock('@nestjs/swagger', () => ({
  SwaggerModule: {
    createDocument: jest.fn(),
    setup: jest.fn(),
  },
  DocumentBuilder: jest.fn(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock('cookie-parser', () => jest.fn(() => 'cookie-parser-middleware'));

jest.mock('./app.module', () => ({
  AppModule: jest.fn(),
}));

jest.mock('./modules/config/config.service', () => ({
  AppConfigService: jest.fn(),
}));

// Mock console.log
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('Main Bootstrap', () => {
  let mockApp: any;
  let mockConfigService: any;
  let mockReflector: any;
  let NestFactory: any;
  let SwaggerModule: any;
  let cookieParser: any;
  let ClassSerializerInterceptor: any;
  let Reflector: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mocked modules
    NestFactory = require('@nestjs/core').NestFactory;
    Reflector = require('@nestjs/core').Reflector;
    SwaggerModule = require('@nestjs/swagger').SwaggerModule;
    cookieParser = require('cookie-parser');
    ClassSerializerInterceptor = require('@nestjs/common').ClassSerializerInterceptor;

    // Setup mock reflector
    mockReflector = { get: jest.fn() };

    // Setup mock config service
    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'app.url': 'http://localhost',
          'app.apiPrefix': 'api',
          'app.port': 3000,
          'app.authSecret': 'test-secret',
          'app.isDev': false,
        };
        return config[key];
      }),
    };

    // Setup mock app
    mockApp = {
      get: jest.fn((type: any) => {
        if (type === Reflector) {
          return mockReflector;
        }
        return mockConfigService;
      }),
      setGlobalPrefix: jest.fn(),
      enableVersioning: jest.fn(),
      useGlobalInterceptors: jest.fn(),
      use: jest.fn(),
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    NestFactory.create.mockResolvedValue(mockApp);
  });

  it('should bootstrap the application with correct configuration', async () => {
    await bootstrap();

    // Verify NestFactory creates app with AppModule
    expect(NestFactory.create).toHaveBeenCalledWith(expect.any(Function));

    // Verify configuration is retrieved
    expect(mockApp.get).toHaveBeenCalled();

    // Verify global prefix is set
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');

    // Verify versioning is enabled
    expect(mockApp.enableVersioning).toHaveBeenCalledWith({
      type: 'URI',
      defaultVersion: '1',
    });

    // Verify interceptors are set with Reflector
    expect(mockApp.useGlobalInterceptors).toHaveBeenCalled();
    expect(ClassSerializerInterceptor).toHaveBeenCalled();
    expect(mockApp.get).toHaveBeenCalledWith(Reflector);

    // Verify cookie parser is configured
    expect(cookieParser).toHaveBeenCalledWith('test-secret');
    expect(mockApp.use).toHaveBeenCalledWith('cookie-parser-middleware');

    // Verify CORS is enabled
    expect(mockApp.enableCors).toHaveBeenCalledWith({
      origin: true,
      credentials: true,
    });

    // Verify app listens on correct port
    expect(mockApp.listen).toHaveBeenCalledWith(3000);

    // Verify console log
    expect(console.log).toHaveBeenCalledWith('Application is running on: http://localhost:3000/api');
  });

  it('should not set global prefix when apiPrefix is empty', async () => {
    mockConfigService.get = jest.fn((key: string) => {
      const config: Record<string, any> = {
        'app.url': 'http://localhost',
        'app.apiPrefix': '',
        'app.port': 3000,
        'app.authSecret': 'test-secret',
        'app.isDev': false,
      };
      return config[key];
    });

    await bootstrap();

    expect(mockApp.setGlobalPrefix).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Application is running on: http://localhost:3000/');
  });

  describe('Swagger configuration', () => {
    it('should setup Swagger in development environment', async () => {
      mockConfigService.get = jest.fn((key: string) => {
        const config: Record<string, any> = {
          'app.url': 'http://localhost',
          'app.apiPrefix': 'api',
          'app.port': 3000,
          'app.authSecret': 'test-secret',
          'app.isDev': true,
        };
        return config[key];
      });

      const mockDocument = { info: { title: 'API' } };
      SwaggerModule.createDocument.mockReturnValue(mockDocument);

      await bootstrap();

      const DocumentBuilder = require('@nestjs/swagger').DocumentBuilder;
      expect(DocumentBuilder).toHaveBeenCalled();
      expect(SwaggerModule.createDocument).toHaveBeenCalledWith(mockApp, expect.any(Object));
      expect(SwaggerModule.setup).toHaveBeenCalledWith('docs', mockApp, mockDocument);
    });

    it('should not setup Swagger in production environment', async () => {
      mockConfigService.get = jest.fn((key: string) => {
        const config: Record<string, any> = {
          'app.url': 'http://localhost',
          'app.apiPrefix': 'api',
          'app.port': 3000,
          'app.authSecret': 'test-secret',
          'app.isDev': false,
        };
        return config[key];
      });

      await bootstrap();

      expect(SwaggerModule.createDocument).not.toHaveBeenCalled();
      expect(SwaggerModule.setup).not.toHaveBeenCalled();
    });
  });

  it('should handle different port and URL configurations', async () => {
    mockConfigService.get = jest.fn((key: string) => {
      const config: Record<string, any> = {
        'app.url': 'https://api.example.com',
        'app.apiPrefix': 'v1',
        'app.port': 8080,
        'app.authSecret': 'prod-secret',
        'app.isDev': false,
      };
      return config[key];
    });

    await bootstrap();

    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('v1');
    expect(mockApp.listen).toHaveBeenCalledWith(8080);
    expect(cookieParser).toHaveBeenCalledWith('prod-secret');
    expect(console.log).toHaveBeenCalledWith('Application is running on: https://api.example.com:8080/v1');
  });

  it('should configure all middleware and interceptors', async () => {
    await bootstrap();

    // Verify all configurations are applied
    expect(mockApp.get).toHaveBeenCalled();
    expect(mockApp.enableVersioning).toHaveBeenCalled();
    expect(mockApp.useGlobalInterceptors).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalled();
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalled();
  });
});
