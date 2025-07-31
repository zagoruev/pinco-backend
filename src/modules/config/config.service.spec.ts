import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AppConfigService } from './config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return string value from config', () => {
      mockConfigService.get.mockReturnValue('test-value');

      const result = service.get('app.url');

      expect(configService.get).toHaveBeenCalledWith('app.url');
      expect(result).toBe('test-value');
    });

    it('should return number value from config', () => {
      mockConfigService.get.mockReturnValue(3000);

      const result = service.get('app.port');

      expect(configService.get).toHaveBeenCalledWith('app.port');
      expect(result).toBe(3000);
    });

    it('should return boolean value from config', () => {
      mockConfigService.get.mockReturnValue(true);

      const result = service.get('app.widgetIsDev');

      expect(configService.get).toHaveBeenCalledWith('app.widgetIsDev');
      expect(result).toBe(true);
    });

    it('should return nested config values', () => {
      mockConfigService.get.mockReturnValue('localhost');

      const result = service.get('database.host');

      expect(configService.get).toHaveBeenCalledWith('database.host');
      expect(result).toBe('localhost');
    });

    it('should return null for non-existent config', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = service.get('app.nonExistent' as any);

      expect(configService.get).toHaveBeenCalledWith('app.nonExistent');
      expect(result).toBeUndefined();
    });

    it('should handle email config paths', () => {
      mockConfigService.get.mockReturnValue('smtp.example.com');

      const result = service.get('email.host');

      expect(configService.get).toHaveBeenCalledWith('email.host');
      expect(result).toBe('smtp.example.com');
    });

    it('should handle screenshot config paths', () => {
      mockConfigService.get.mockReturnValue('./screenshots');

      const result = service.get('screenshot.baseDir');

      expect(configService.get).toHaveBeenCalledWith('screenshot.baseDir');
      expect(result).toBe('./screenshots');
    });

    it('should preserve the type returned by ConfigService', () => {
      const complexValue = {
        key1: 'value1',
        key2: 123,
        key3: true,
      };
      mockConfigService.get.mockReturnValue(complexValue);

      const result = service.get('app.complex' as any);

      expect(result).toEqual(complexValue);
      expect(result).toBe(complexValue);
    });
  });
});
