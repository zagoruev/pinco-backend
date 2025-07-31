import { Test, TestingModule } from '@nestjs/testing';
import { WidgetService } from './widget.service';
import { AppConfigService } from '../config/config.service';
import { RequestUser } from '../../types/express';
import { USER_COLORS } from '../user/user.entity';

describe('WidgetService', () => {
  let service: WidgetService;
  let configService: AppConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRequestUser: RequestUser = {
    id: 1,
    email: 'user@example.com',
    roles: ['COLLABORATOR'],
    sites: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetService,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WidgetService>(WidgetService);
    configService = module.get<AppConfigService>(AppConfigService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateWidgetScript', () => {
    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'app.url':
            return 'https://api.example.com';
          case 'app.widgetIsDev':
            return false;
          case 'app.widgetUrl':
            return 'https://widget.example.com';
          case 'app.widgetDevUrl':
            return 'http://localhost:5173';
          default:
            return null;
        }
      });
    });

    it('should generate widget script for authenticated user', () => {
      const result = service.generateWidgetScript('test-key', mockRequestUser);

      expect(result).toContain('var Pinco = {');
      expect(result).toContain('"apiRoot": "https://api.example.com/"');
      expect(result).toContain('"userId": 1');
      expect(result).toContain('"colors": [');
      expect(result).toContain('"features": [');
      expect(result).toContain('"screenshots"');
      expect(result).toContain('"details"');
      expect(result).toContain(
        "element.src = 'https://widget.example.com/js/ui.js';",
      );
      expect(result).toContain(
        "element.href = 'https://widget.example.com/css/ui.css';",
      );
      expect(result).toContain("root.id = 'pinco-ui';");
    });

    it('should generate widget script for unauthenticated user', () => {
      const result = service.generateWidgetScript(
        'test-key',
        null as unknown as RequestUser,
      );

      expect(result).toContain('var Pinco = {');
      expect(result).toContain('"apiRoot": "https://api.example.com/"');
      expect(result).not.toContain('"userId"');
    });

    it('should generate dev widget script without CSS', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'app.url':
            return 'https://api.example.com';
          case 'app.widgetIsDev':
            return true;
          case 'app.widgetDevUrl':
            return 'http://localhost:5173';
          default:
            return null;
        }
      });

      const result = service.generateWidgetScript('test-key', mockRequestUser);

      expect(result).toContain(
        "element.src = 'http://localhost:5173/js/ui.js';",
      );
      expect(result).not.toContain('element.href');
      expect(result).not.toContain('css');
    });

    it('should include correct colors array', () => {
      const result = service.generateWidgetScript('test-key', mockRequestUser);

      // Verify colors array is present
      expect(result).toContain('"colors": [');

      // Check for specific colors
      USER_COLORS.forEach((color) => {
        expect(result).toContain(`"${color}"`);
      });

      // Verify first color
      expect(result).toContain('"#4C53F1"');
    });

    it('should handle edge case when widgetIsDev returns string "false"', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'app.url':
            return 'https://api.example.com';
          case 'app.widgetIsDev':
            return 'false'; // String instead of boolean
          case 'app.widgetUrl':
            return 'https://widget.example.com';
          case 'app.widgetDevUrl':
            return 'http://localhost:5173';
          default:
            return null;
        }
      });

      const result = service.generateWidgetScript('test-key', mockRequestUser);

      // String "false" is truthy, so should use dev URL
      expect(result).toContain(
        "element.src = 'http://localhost:5173/js/ui.js';",
      );
      expect(result).not.toContain('element.href');
      expect(result).not.toContain('css');
    });

    it('should handle user with numeric string id', () => {
      const userWithStringId: RequestUser = {
        ...mockRequestUser,
        id: '123' as unknown as number,
      };

      const result = service.generateWidgetScript('test-key', userWithStringId);

      expect(result).toContain('"userId": 123');
    });

    it('should create valid JavaScript', () => {
      const result = service.generateWidgetScript('test-key', mockRequestUser);

      // Check for proper function wrapper
      expect(result).toContain('(function() {');
      expect(result).toContain(')();');

      // Check for DOM manipulation
      expect(result).toContain("document.createElement('div')");
      expect(result).toContain('document.body.appendChild(root)');
      expect(result).toContain('document.head.appendChild(element)');
    });
  });
});
