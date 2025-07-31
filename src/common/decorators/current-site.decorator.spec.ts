import 'reflect-metadata';

import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { Site } from '../../modules/site/site.entity';
import { CurrentSite } from './current-site.decorator';

describe('CurrentSite Decorator', () => {
  let mockSite: Site;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    mockSite = {
      id: 1,
      name: 'Test Site',
      url: 'https://test.com',
      domain: 'test.com',
      license: 'ABC123',
      active: true,
      created: new Date(),
      updated: new Date(),
      userSites: [],
      comments: [],
    };

    mockRequest = {
      site: mockSite,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(CurrentSite).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof CurrentSite).toBe('function');
  });

  it('should properly decorate controller methods', () => {
    class TestController {
      testMethod(@CurrentSite() site: Site) {
        return site;
      }
    }

    const controller = new TestController();
    expect(controller.testMethod).toBeDefined();

    // Check metadata was applied
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    expect(metadata).toBeDefined();

    const keys = Object.keys(metadata);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('should extract site from request when decorator is executed', () => {
    // Mock a controller method with the decorator
    class TestController {
      testMethod(@CurrentSite() site: Site) {
        return site;
      }
    }

    // Get the metadata
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    // The factory function should extract site from request
    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      expect(result).toEqual(mockSite);
      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
    }
  });

  it('should handle undefined site', () => {
    class TestController {
      testMethod(@CurrentSite() site: Site) {
        return site;
      }
    }

    mockRequest.site = undefined;

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      expect(result).toBeUndefined();
    }
  });

  it('should handle null site', () => {
    class TestController {
      testMethod(@CurrentSite() site: Site) {
        return site;
      }
    }

    mockRequest.site = null;

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      expect(result).toBeNull();
    }
  });

  it('should handle different site data', () => {
    class TestController {
      testMethod(@CurrentSite() site: Site) {
        return site;
      }
    }

    const differentSite: Site = {
      id: 2,
      name: 'Another Site',
      url: 'https://another.com',
      domain: 'another.com',
      license: 'XYZ789',
      active: false,
      created: new Date(),
      updated: new Date(),
      userSites: [],
      comments: [],
    };

    mockRequest.site = differentSite;

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      expect(result).toEqual(differentSite);
    }
  });

  it('should use switchToHttp to get the request', () => {
    class TestController {
      testMethod(@CurrentSite() site: Site) {
        return site;
      }
    }

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    if (decoratorMetadata && decoratorMetadata.factory) {
      decoratorMetadata.factory(undefined, mockExecutionContext);

      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      const httpContext = mockExecutionContext.switchToHttp();
      expect(httpContext.getRequest).toHaveBeenCalled();
    }
  });

  it('should work with multiple parameters', () => {
    class TestController {
      testMethod(@CurrentSite() site: Site, otherParam: string) {
        return { site, otherParam };
      }
    }

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    expect(metadata).toBeDefined();

    // Find the decorator metadata
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];
    expect(decoratorMetadata).toBeDefined();
    expect(decoratorMetadata.index).toBe(0);
  });
});
