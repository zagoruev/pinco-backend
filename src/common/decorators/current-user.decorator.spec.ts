import 'reflect-metadata';

import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { RequestUser } from '../../types/express';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  let mockUser: RequestUser;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    mockUser = {
      id: 1,
      email: 'test@example.com',
      roles: ['ADMIN'],
      sites: [],
    };

    mockRequest = {
      user: mockUser,
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
    expect(CurrentUser).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof CurrentUser).toBe('function');
  });

  it('should properly decorate controller methods', () => {
    class TestController {
      testMethod(@CurrentUser() user: RequestUser | undefined) {
        return user;
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

  it('should extract user from request when decorator is executed', () => {
    // Mock a controller method with the decorator
    class TestController {
      testMethod(@CurrentUser() user: RequestUser) {
        return user;
      }
    }

    // Get the metadata
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    // The factory function should extract user from request
    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      expect(result).toEqual(mockUser);
      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
    }
  });

  it('should handle undefined user', () => {
    class TestController {
      testMethod(@CurrentUser() user: RequestUser | undefined) {
        return user;
      }
    }

    mockRequest.user = undefined;

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      expect(result).toBeUndefined();
    }
  });

  it('should handle null user', () => {
    class TestController {
      testMethod(@CurrentUser() user: RequestUser | null) {
        return user;
      }
    }

    mockRequest.user = null;

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      expect(result).toBeNull();
    }
  });

  it('should handle different user data', () => {
    class TestController {
      testMethod(@CurrentUser() user: RequestUser) {
        return user;
      }
    }

    const differentUser: RequestUser = {
      id: 2,
      email: 'another@example.com',
      roles: ['SITE_OWNER', 'COMMENTER'],
      sites: [],
    };

    mockRequest.user = differentUser;

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      expect(result).toEqual(differentUser);
    }
  });

  it('should use switchToHttp to get the request', () => {
    class TestController {
      testMethod(@CurrentUser() user: RequestUser) {
        return user;
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
      testMethod(@CurrentUser() user: RequestUser, otherParam: string) {
        return { user, otherParam };
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

  it('should handle users with different roles', () => {
    class TestController {
      testMethod(@CurrentUser() user: RequestUser) {
        return user;
      }
    }

    const adminUser: RequestUser = {
      id: 3,
      email: 'admin@example.com',
      roles: ['ADMIN', 'SITE_OWNER'],
      sites: [],
    };

    mockRequest.user = adminUser;

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      expect(result).toEqual(adminUser);
      expect(result.roles).toContain('ADMIN');
      expect(result.roles).toContain('SITE_OWNER');
    }
  });

  it('should return the exact reference from request', () => {
    class TestController {
      testMethod(@CurrentUser() user: RequestUser) {
        return user;
      }
    }

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    const keys = Object.keys(metadata);
    const decoratorMetadata = metadata[keys[0]];

    if (decoratorMetadata && decoratorMetadata.factory) {
      const result = decoratorMetadata.factory(undefined, mockExecutionContext);
      // Should return the exact same reference
      expect(result).toBe(mockRequest.user);
    }
  });
});
