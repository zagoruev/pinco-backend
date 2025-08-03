import { Request } from 'express';
import { Repository } from 'typeorm';

import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { RequestUser } from '../../types/express';
import { AppConfigService } from '../config/config.service';
import { Site } from '../site/site.entity';
import { USER_COLORS } from '../user/user.entity';
import { WidgetService } from './widget.service';

describe('WidgetService', () => {
  let service: WidgetService;
  let configService: AppConfigService;
  let siteRepository: Repository<Site>;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockSiteRepository = {
    findOne: jest.fn(),
  };

  const mockRequestUser: RequestUser = {
    id: 1,
    email: 'user@example.com',
    roles: ['COLLABORATOR'],
    sites: [],
  };

  const mockSite = {
    id: 1,
    name: 'Test Site',
    url: 'https://test.com',
    domain: 'test.com',
    license: 'ABC123',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [{ user_id: 1, site_id: 1 }],
  } as Site;

  const mockRequest = {
    headers: {
      origin: 'https://test.com',
      referer: 'https://test.com/page',
    },
  } as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetService,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(Site),
          useValue: mockSiteRepository,
        },
      ],
    }).compile();

    service = module.get<WidgetService>(WidgetService);
    configService = module.get<AppConfigService>(AppConfigService);
    siteRepository = module.get<Repository<Site>>(getRepositoryToken(Site));

    // Reset all mocks
    jest.clearAllMocks();

    // Default config values
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateWidgetScript', () => {
    it('should generate widget script for authenticated user', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce(mockSite);

      const result = await service.generateWidgetScript('test-key', mockRequestUser, mockRequest);

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'test.com', active: true },
        relations: ['userSites'],
      });

      expect(result).toContain('var Pinco = {');
      expect(result).toContain('"apiRoot": "https://api.example.com/"');
      expect(result).toContain('"userId": 1');
      expect(result).toContain('"colors": [');
      expect(result).toContain('"features": [');
      expect(result).toContain('"screenshots"');
      expect(result).toContain('"details"');
      expect(result).toContain("element.src = 'https://widget.example.com/js/ui.js';");
      expect(result).toContain("element.href = 'https://widget.example.com/css/ui.css';");
      expect(result).toContain("root.id = 'pinco-ui';");
    });

    it('should generate widget script for unauthenticated user', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce(mockSite);

      const result = await service.generateWidgetScript('test-key', null as unknown as RequestUser, mockRequest);

      expect(result).toContain('var Pinco = {');
      expect(result).toContain('"apiRoot": "https://api.example.com/"');
      expect(result).not.toContain('"userId"');
    });

    it('should generate dev widget script without CSS', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce(mockSite);
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

      const result = await service.generateWidgetScript('test-key', mockRequestUser, mockRequest);

      expect(result).toContain("element.src = 'http://localhost:5173/js/ui.js';");
      expect(result).not.toContain('element.href');
      expect(result).not.toContain('css');
    });

    it('should throw ForbiddenException when origin is not provided', async () => {
      const requestWithoutOrigin = {
        headers: {},
      } as Request;

      await expect(service.generateWidgetScript('test-key', mockRequestUser, requestWithoutOrigin)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.generateWidgetScript('test-key', mockRequestUser, requestWithoutOrigin)).rejects.toThrow(
        'Origin not provided',
      );
    });

    it('should use referer header when origin is not present', async () => {
      const requestWithOnlyReferer = {
        headers: {
          referer: 'https://test.com/page',
        },
      } as Request;

      mockSiteRepository.findOne.mockResolvedValueOnce(mockSite);

      const result = await service.generateWidgetScript('test-key', mockRequestUser, requestWithOnlyReferer);

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'test.com', active: true },
        relations: ['userSites'],
      });
      expect(result).toContain('var Pinco = {');
    });

    it('should return console info when site is not found', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.generateWidgetScript('test-key', mockRequestUser, mockRequest);

      expect(result).toBe('console.info("Pinco: site not found");');
    });

    it('should return console info when site is inactive', async () => {
      const inactiveSite = { ...mockSite, active: false };
      mockSiteRepository.findOne.mockResolvedValueOnce(null); // Site won't be found due to active: true filter

      const result = await service.generateWidgetScript('test-key', mockRequestUser, mockRequest);

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'test.com', active: true },
        relations: ['userSites'],
      });
      expect(result).toBe('console.info("Pinco: site not found");');
    });

    it('should include correct colors array', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce(mockSite);

      const result = await service.generateWidgetScript('test-key', mockRequestUser, mockRequest);

      // Verify colors array is present
      expect(result).toContain('"colors": [');

      // Check for specific colors
      USER_COLORS.forEach((color) => {
        expect(result).toContain(`"${color}"`);
      });
    });

    it('should handle edge case when widgetIsDev returns string "false"', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce(mockSite);
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

      const result = await service.generateWidgetScript('test-key', mockRequestUser, mockRequest);

      // String "false" is truthy, so should use dev URL
      expect(result).toContain("element.src = 'http://localhost:5173/js/ui.js';");
      expect(result).not.toContain('element.href');
      expect(result).not.toContain('css');
    });

    it('should handle user with numeric string id', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce({ ...mockSite, userSites: [{ user_id: 123, site_id: 1 }] });
      const userWithStringId: RequestUser = {
        ...mockRequestUser,
        id: '123' as unknown as number,
      };

      const result = await service.generateWidgetScript('test-key', userWithStringId, mockRequest);

      expect(result).toContain('"userId": 123');
    });

    it('should create valid JavaScript', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce(mockSite);

      const result = await service.generateWidgetScript('test-key', mockRequestUser, mockRequest);

      // Check for proper function wrapper
      expect(result).toContain('(function() {');
      expect(result).toContain(')();');

      // Check for DOM manipulation
      expect(result).toContain("document.createElement('div')");
      expect(result).toContain('document.body.appendChild(root)');
      expect(result).toContain('document.head.appendChild(element)');
    });

    it('should handle different URL protocols correctly', async () => {
      const httpsRequest = {
        headers: {
          origin: 'https://secure.test.com',
        },
      } as Request;

      mockSiteRepository.findOne.mockResolvedValueOnce({ ...mockSite, domain: 'secure.test.com' });

      const result = await service.generateWidgetScript('test-key', mockRequestUser, httpsRequest);

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'secure.test.com', active: true },
        relations: ['userSites'],
      });
      expect(result).toContain('var Pinco = {');
    });

    it('should handle subdomains correctly', async () => {
      const subdomainRequest = {
        headers: {
          origin: 'https://app.test.com',
        },
      } as Request;

      mockSiteRepository.findOne.mockResolvedValueOnce({ ...mockSite, domain: 'app.test.com' });

      const result = await service.generateWidgetScript('test-key', mockRequestUser, subdomainRequest);

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'app.test.com', active: true },
        relations: ['userSites'],
      });
      expect(result).toContain('var Pinco = {');
    });

    it('should handle URLs with ports correctly', async () => {
      const portRequest = {
        headers: {
          origin: 'http://localhost:3000',
        },
      } as Request;

      mockSiteRepository.findOne.mockResolvedValueOnce({ ...mockSite, domain: 'localhost' });

      const result = await service.generateWidgetScript('test-key', mockRequestUser, portRequest);

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'localhost', active: true },
        relations: ['userSites'],
      });
      expect(result).toContain('var Pinco = {');
    });

    it('should set dir attribute to ltr', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce(mockSite);

      const result = await service.generateWidgetScript('test-key', mockRequestUser, mockRequest);

      expect(result).toContain("root.dir = 'ltr';");
    });

    it('should handle undefined user gracefully', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce(mockSite);

      const result = await service.generateWidgetScript('test-key', undefined as any, mockRequest);

      expect(result).toContain('var Pinco = {');
      expect(result).not.toContain('"userId"');
    });

    it('should handle edge case with zero user id', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce({ ...mockSite, userSites: [{ user_id: 0, site_id: 1 }] });
      const userWithZeroId: RequestUser = {
        ...mockRequestUser,
        id: 0,
      };

      const result = await service.generateWidgetScript('test-key', userWithZeroId, mockRequest);

      expect(result).toContain('"userId": 0');
    });

    it('should not include userId when user does not belong to site', async () => {
      mockSiteRepository.findOne.mockResolvedValueOnce({ ...mockSite, userSites: [{ user_id: 999, site_id: 1 }] });

      const result = await service.generateWidgetScript('test-key', mockRequestUser, mockRequest);

      expect(result).toContain('var Pinco = {');
      expect(result).not.toContain('"userId"');
    });
  });
});