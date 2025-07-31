import * as Joi from 'joi';
import {
  appConfig,
  databaseConfig,
  emailConfig,
  screenshotConfig,
  validationSchema,
  Config,
} from './index';

// Mock parse-duration
jest.mock('parse-duration', () => ({
  __esModule: true,
  default: jest.fn((value: string) => {
    if (value === '7d') return 7 * 24 * 60 * 60 * 1000;
    if (value === '1h') return 60 * 60 * 1000;
    if (value === '30m') return 30 * 60 * 1000;
    return 86400000; // default 1 day
  }),
}));

describe('Config Index', () => {
  describe('exports', () => {
    it('should export all config functions', () => {
      expect(appConfig).toBeDefined();
      expect(databaseConfig).toBeDefined();
      expect(emailConfig).toBeDefined();
      expect(screenshotConfig).toBeDefined();
      expect(validationSchema).toBeDefined();
    });

    it('should export correct config functions', () => {
      expect(typeof appConfig).toBe('function');
      expect(typeof databaseConfig).toBe('function');
      expect(typeof emailConfig).toBe('function');
      expect(typeof screenshotConfig).toBe('function');
    });
  });

  describe('validationSchema', () => {
    it('should be a Joi schema', () => {
      expect(validationSchema).toBeDefined();
      expect(validationSchema.validate).toBeDefined();
      expect(typeof validationSchema.validate).toBe('function');
    });

    it('should validate a complete valid configuration', () => {
      const validConfig = {
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_USERNAME: 'root',
        DB_PASSWORD: 'password',
        DB_DATABASE: 'test_db',
        NODE_ENV: 'development',
        PORT: 3000,
        API_PREFIX: 'api',
        APP_URL: 'http://localhost:3000',
        WIDGET_URL: 'http://localhost:5173',
        AUTH_SECRET: 'secret-key',
        AUTH_TOKEN_EXPIRES_IN: '7d',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: 587,
        SMTP_USER: 'user@gmail.com',
        SMTP_PASS: 'password',
        EMAIL_FROM: 'noreply@example.com',
        SCREENSHOT_BASE_DIR: './screenshots',
        SCREENSHOT_BASE_URL: 'http://localhost:3000/screenshots',
      };

      const { error } = validationSchema.validate(validConfig);
      expect(error).toBeUndefined();
    });

    it('should fail validation when required fields are missing', () => {
      const invalidConfig = {
        PORT: 3000,
        API_PREFIX: 'api',
      };

      const { error } = validationSchema.validate(invalidConfig);
      expect(error).toBeDefined();
      expect(error?.details).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(0);
    });

    it('should fail validation for invalid NODE_ENV', () => {
      const invalidConfig = {
        DB_HOST: 'localhost',
        DB_USERNAME: 'root',
        DB_PASSWORD: 'password',
        DB_DATABASE: 'test_db',
        NODE_ENV: 'staging', // Invalid value
        APP_URL: 'http://localhost:3000',
        WIDGET_URL: 'http://localhost:5173',
        AUTH_SECRET: 'secret-key',
        AUTH_TOKEN_EXPIRES_IN: '7d',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_USER: 'user@gmail.com',
        SMTP_PASS: 'password',
        EMAIL_FROM: 'noreply@example.com',
        SCREENSHOT_BASE_DIR: './screenshots',
        SCREENSHOT_BASE_URL: 'http://localhost:3000/screenshots',
      };

      const { error } = validationSchema.validate(invalidConfig);
      expect(error).toBeDefined();
      expect(error?.message).toContain('NODE_ENV');
    });

    it('should fail validation for invalid URL formats', () => {
      const invalidConfig = {
        DB_HOST: 'localhost',
        DB_USERNAME: 'root',
        DB_PASSWORD: 'password',
        DB_DATABASE: 'test_db',
        NODE_ENV: 'development',
        APP_URL: 'not-a-url', // Invalid URL
        WIDGET_URL: 'http://localhost:5173',
        AUTH_SECRET: 'secret-key',
        AUTH_TOKEN_EXPIRES_IN: '7d',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_USER: 'user@gmail.com',
        SMTP_PASS: 'password',
        EMAIL_FROM: 'noreply@example.com',
        SCREENSHOT_BASE_DIR: './screenshots',
        SCREENSHOT_BASE_URL: 'http://localhost:3000/screenshots',
      };

      const { error } = validationSchema.validate(invalidConfig);
      expect(error).toBeDefined();
      expect(error?.message).toContain('APP_URL');
    });

    it('should apply default values', () => {
      const minimalConfig = {
        DB_HOST: 'localhost',
        DB_USERNAME: 'root',
        DB_PASSWORD: 'password',
        DB_DATABASE: 'test_db',
        NODE_ENV: 'development',
        APP_URL: 'http://localhost:3000',
        WIDGET_URL: 'http://localhost:5173',
        AUTH_SECRET: 'secret-key',
        AUTH_TOKEN_EXPIRES_IN: '7d',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_USER: 'user@gmail.com',
        SMTP_PASS: 'password',
        EMAIL_FROM: 'noreply@example.com',
        SCREENSHOT_BASE_DIR: './screenshots',
        SCREENSHOT_BASE_URL: 'http://localhost:3000/screenshots',
        // Omitting: DB_PORT, PORT, API_PREFIX, SMTP_PORT (have defaults)
      };

      const { error, value } = validationSchema.validate(minimalConfig);
      expect(error).toBeUndefined();
      expect(value.DB_PORT).toBe(3306);
      expect(value.PORT).toBe(3000);
      expect(value.API_PREFIX).toBe('api');
      expect(value.SMTP_PORT).toBe(587);
    });

    it('should validate all required database fields', () => {
      const configWithoutDb = {
        NODE_ENV: 'development',
        PORT: 3000,
        API_PREFIX: 'api',
        APP_URL: 'http://localhost:3000',
        WIDGET_URL: 'http://localhost:5173',
        AUTH_SECRET: 'secret-key',
        AUTH_TOKEN_EXPIRES_IN: '7d',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_USER: 'user@gmail.com',
        SMTP_PASS: 'password',
        EMAIL_FROM: 'noreply@example.com',
        SCREENSHOT_BASE_DIR: './screenshots',
        SCREENSHOT_BASE_URL: 'http://localhost:3000/screenshots',
      };

      const { error } = validationSchema.validate(configWithoutDb, {
        abortEarly: false,
      });
      expect(error).toBeDefined();
      const errorMessages = error?.details.map((d) => d.path[0]);
      expect(errorMessages).toContain('DB_HOST');
      expect(errorMessages).toContain('DB_USERNAME');
      expect(errorMessages).toContain('DB_PASSWORD');
      expect(errorMessages).toContain('DB_DATABASE');
    });

    it('should validate all required email fields', () => {
      const configWithoutEmail = {
        DB_HOST: 'localhost',
        DB_USERNAME: 'root',
        DB_PASSWORD: 'password',
        DB_DATABASE: 'test_db',
        NODE_ENV: 'development',
        PORT: 3000,
        API_PREFIX: 'api',
        APP_URL: 'http://localhost:3000',
        WIDGET_URL: 'http://localhost:5173',
        AUTH_SECRET: 'secret-key',
        AUTH_TOKEN_EXPIRES_IN: '7d',
        SCREENSHOT_BASE_DIR: './screenshots',
        SCREENSHOT_BASE_URL: 'http://localhost:3000/screenshots',
      };

      const { error } = validationSchema.validate(configWithoutEmail, {
        abortEarly: false,
      });
      expect(error).toBeDefined();
      const errorMessages = error?.details.map((d) => d.path[0]);
      expect(errorMessages).toContain('SMTP_HOST');
      expect(errorMessages).toContain('SMTP_USER');
      expect(errorMessages).toContain('SMTP_PASS');
      expect(errorMessages).toContain('EMAIL_FROM');
    });

    it('should validate port numbers are numbers', () => {
      const configWithStringPorts = {
        DB_HOST: 'localhost',
        DB_PORT: 'not-a-number',
        DB_USERNAME: 'root',
        DB_PASSWORD: 'password',
        DB_DATABASE: 'test_db',
        NODE_ENV: 'development',
        PORT: 'also-not-a-number',
        API_PREFIX: 'api',
        APP_URL: 'http://localhost:3000',
        WIDGET_URL: 'http://localhost:5173',
        AUTH_SECRET: 'secret-key',
        AUTH_TOKEN_EXPIRES_IN: '7d',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: 'invalid',
        SMTP_USER: 'user@gmail.com',
        SMTP_PASS: 'password',
        EMAIL_FROM: 'noreply@example.com',
        SCREENSHOT_BASE_DIR: './screenshots',
        SCREENSHOT_BASE_URL: 'http://localhost:3000/screenshots',
      };

      const { error } = validationSchema.validate(configWithStringPorts);
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/must be a number/);
    });
  });

  describe('Config type', () => {
    it('should have correct structure', () => {
      // This is a compile-time check, but we can verify the runtime structure
      const config: Config = {
        app: appConfig(),
        database: databaseConfig(),
        email: emailConfig(),
        screenshot: screenshotConfig(),
      };

      expect(config).toHaveProperty('app');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('email');
      expect(config).toHaveProperty('screenshot');
    });
  });
});
