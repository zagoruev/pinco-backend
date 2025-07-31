import { Test, TestingModule } from '@nestjs/testing';
import { ScreenshotService, SCREENSHOT_STRATEGY } from './screenshot.service';
import { ScreenshotStrategy } from './strategies/screenshot-strategy.interface';
import { Comment } from '../comment/comment.entity';
import { User } from '../user/user.entity';
import { Site } from '../site/site.entity';

describe('ScreenshotService', () => {
  let service: ScreenshotService;
  let mockStrategy: jest.Mocked<ScreenshotStrategy>;

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    username: 'testuser',
    password: 'hashed',
    active: true,
    roles: [],
    created: new Date(),
    updated: new Date(),
    sites: [],
    comments: [],
    replies: [],
    commentViews: [],
    get color() {
      return '#4C53F1';
    },
  } as User;

  const mockSite = {
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
  } as Site;

  const createMockComment = (overrides?: Partial<Comment>): Comment => ({
    id: 1,
    uniqid: 'test123',
    message: 'Test comment',
    user_id: 1,
    site_id: 1,
    url: 'https://test.com/page',
    details: null,
    reference: null,
    resolved: false,
    screenshot: null,
    created: new Date(),
    updated: new Date(),
    user: mockUser,
    site: mockSite,
    replies: [],
    views: [],
    get viewed() {
      return null;
    },
    ...overrides,
  } as Comment);

  beforeEach(async () => {
    // Create mock strategy
    mockStrategy = {
      save: jest.fn(),
      getUrl: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreenshotService,
        {
          provide: SCREENSHOT_STRATEGY,
          useValue: mockStrategy,
        },
      ],
    }).compile();

    service = module.get<ScreenshotService>(ScreenshotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a screenshot using the strategy', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'screenshot',
        originalname: 'test-screenshot.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        destination: '',
        filename: 'test-screenshot.png',
        path: '',
        buffer: Buffer.from('test-image-data'),
        stream: null as any,
      };
      const mockComment = createMockComment();
      const expectedPath = 'test123.png';

      mockStrategy.save.mockResolvedValue(expectedPath);

      const result = await service.save(mockFile, mockComment);

      expect(mockStrategy.save).toHaveBeenCalledWith(mockFile, mockComment);
      expect(result).toBe(expectedPath);
    });

    it('should handle save errors', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'screenshot',
        originalname: 'test-screenshot.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        destination: '',
        filename: 'test-screenshot.png',
        path: '',
        buffer: Buffer.from('test-image-data'),
        stream: null as any,
      };
      const mockComment = createMockComment();
      const error = new Error('Failed to save');

      mockStrategy.save.mockRejectedValue(error);

      await expect(service.save(mockFile, mockComment)).rejects.toThrow('Failed to save');
      expect(mockStrategy.save).toHaveBeenCalledWith(mockFile, mockComment);
    });

    it('should handle empty buffer', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'screenshot',
        originalname: 'empty.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 0,
        destination: '',
        filename: 'empty.png',
        path: '',
        buffer: Buffer.alloc(0),
        stream: null as any,
      };
      const mockComment = createMockComment();

      mockStrategy.save.mockResolvedValue('test123.png');

      const result = await service.save(mockFile, mockComment);

      expect(mockStrategy.save).toHaveBeenCalledWith(mockFile, mockComment);
      expect(result).toBe('test123.png');
    });

    it('should handle different file types', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'screenshot',
        originalname: 'test-screenshot.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048,
        destination: '',
        filename: 'test-screenshot.jpg',
        path: '',
        buffer: Buffer.from('test-jpeg-data'),
        stream: null as any,
      };
      const mockComment = createMockComment();
      const expectedPath = 'test123.png';

      mockStrategy.save.mockResolvedValue(expectedPath);

      const result = await service.save(mockFile, mockComment);

      expect(mockStrategy.save).toHaveBeenCalledWith(mockFile, mockComment);
      expect(result).toBe(expectedPath);
    });
  });

  describe('getUrl', () => {
    it('should get URL for a comment with screenshot', () => {
      const mockComment = createMockComment({ screenshot: 'test123.png' });
      const expectedUrl = 'https://example.com/screenshots/test123.png';

      mockStrategy.getUrl.mockReturnValue(expectedUrl);

      const result = service.getUrl(mockComment);

      expect(mockStrategy.getUrl).toHaveBeenCalledWith(mockComment);
      expect(result).toBe(expectedUrl);
    });

    it('should handle comment without screenshot', () => {
      const mockComment = createMockComment({ screenshot: null });
      const expectedUrl = '';

      mockStrategy.getUrl.mockReturnValue(expectedUrl);

      const result = service.getUrl(mockComment);

      expect(mockStrategy.getUrl).toHaveBeenCalledWith(mockComment);
      expect(result).toBe(expectedUrl);
    });

    it('should handle different uniqids', () => {
      const mockComment = createMockComment({ 
        uniqid: 'different123',
        screenshot: 'different123.png' 
      });
      const expectedUrl = 'https://example.com/screenshots/different123.png';

      mockStrategy.getUrl.mockReturnValue(expectedUrl);

      const result = service.getUrl(mockComment);

      expect(mockStrategy.getUrl).toHaveBeenCalledWith(mockComment);
      expect(result).toBe(expectedUrl);
    });

    it('should handle comments from different sites', () => {
      const differentSite = {
        ...mockSite,
        id: 2,
        domain: 'another.com',
      } as Site;
      const mockComment = createMockComment({ 
        site: differentSite,
        screenshot: 'test123.png' 
      });
      const expectedUrl = 'https://another.com/screenshots/test123.png';

      mockStrategy.getUrl.mockReturnValue(expectedUrl);

      const result = service.getUrl(mockComment);

      expect(mockStrategy.getUrl).toHaveBeenCalledWith(mockComment);
      expect(result).toBe(expectedUrl);
    });
  });

  describe('delete', () => {
    it('should delete a screenshot using the strategy', async () => {
      const mockComment = createMockComment({ screenshot: 'test123.png' });

      mockStrategy.delete.mockResolvedValue(undefined);

      await service.delete(mockComment);

      expect(mockStrategy.delete).toHaveBeenCalledWith(mockComment);
    });

    it('should handle delete errors', async () => {
      const mockComment = createMockComment({ screenshot: 'test123.png' });
      const error = new Error('Failed to delete');

      mockStrategy.delete.mockRejectedValue(error);

      await expect(service.delete(mockComment)).rejects.toThrow('Failed to delete');
      expect(mockStrategy.delete).toHaveBeenCalledWith(mockComment);
    });

    it('should handle comment without screenshot', async () => {
      const mockComment = createMockComment({ screenshot: null });

      mockStrategy.delete.mockResolvedValue(undefined);

      await service.delete(mockComment);

      expect(mockStrategy.delete).toHaveBeenCalledWith(mockComment);
    });

    it('should handle ENOENT errors gracefully', async () => {
      const mockComment = createMockComment({ screenshot: 'non-existent.png' });
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';

      mockStrategy.delete.mockRejectedValue(error);

      await expect(service.delete(mockComment)).rejects.toThrow('File not found');
      expect(mockStrategy.delete).toHaveBeenCalledWith(mockComment);
    });

    it('should handle multiple deletes', async () => {
      const comments = [
        createMockComment({ id: 1, uniqid: 'test1', screenshot: 'test1.png' }),
        createMockComment({ id: 2, uniqid: 'test2', screenshot: 'test2.png' }),
        createMockComment({ id: 3, uniqid: 'test3', screenshot: 'test3.png' }),
      ];

      mockStrategy.delete.mockResolvedValue(undefined);

      for (const comment of comments) {
        await service.delete(comment);
      }

      expect(mockStrategy.delete).toHaveBeenCalledTimes(3);
      comments.forEach((comment, index) => {
        expect(mockStrategy.delete).toHaveBeenNthCalledWith(index + 1, comment);
      });
    });
  });

  describe('strategy injection', () => {
    it('should use the injected strategy', () => {
      expect(service).toBeDefined();
      expect(service['strategy']).toBe(mockStrategy);
    });

    it('should handle strategy replacement', async () => {
      const newMockStrategy: jest.Mocked<ScreenshotStrategy> = {
        save: jest.fn().mockResolvedValue('new123.png'),
        getUrl: jest.fn().mockReturnValue('https://new.com/new123.png'),
        delete: jest.fn().mockResolvedValue(undefined),
      };

      // Replace strategy through reflection (simulating runtime replacement)
      (service as any).strategy = newMockStrategy;

      const mockFile: Express.Multer.File = {
        fieldname: 'screenshot',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        destination: '',
        filename: 'test.png',
        path: '',
        buffer: Buffer.from('test'),
        stream: null as any,
      };
      const mockComment = createMockComment();

      await service.save(mockFile, mockComment);

      expect(newMockStrategy.save).toHaveBeenCalled();
      expect(mockStrategy.save).not.toHaveBeenCalled();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent saves', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => ({
        file: {
          fieldname: 'screenshot',
          originalname: `screenshot-${i}.png`,
          encoding: '7bit',
          mimetype: 'image/png',
          size: 1024,
          destination: '',
          filename: `screenshot-${i}.png`,
          path: '',
          buffer: Buffer.from(`test-${i}`),
          stream: null as any,
        } as Express.Multer.File,
        comment: createMockComment({ id: i, uniqid: `test${i}` }),
        expectedPath: `test${i}.png`,
      }));

      operations.forEach((op) => {
        mockStrategy.save.mockResolvedValueOnce(op.expectedPath);
      });

      const results = await Promise.all(
        operations.map((op) => service.save(op.file, op.comment)),
      );

      expect(mockStrategy.save).toHaveBeenCalledTimes(5);
      results.forEach((result, index) => {
        expect(result).toBe(operations[index].expectedPath);
      });
    });

    it('should handle mixed concurrent operations', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'screenshot',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        destination: '',
        filename: 'test.png',
        path: '',
        buffer: Buffer.from('test'),
        stream: null as any,
      };
      const saveComment = createMockComment({ screenshot: null });
      const getUrlComment = createMockComment({ screenshot: 'test123.png' });
      const deleteComment = createMockComment({ screenshot: 'old.png' });

      mockStrategy.save.mockResolvedValue('test123.png');
      mockStrategy.getUrl.mockReturnValue('https://example.com/screenshots/test123.png');
      mockStrategy.delete.mockResolvedValue(undefined);

      const [saveResult, urlResult, deleteResult] = await Promise.all([
        service.save(mockFile, saveComment),
        service.getUrl(getUrlComment),
        service.delete(deleteComment),
      ]);

      expect(saveResult).toBe('test123.png');
      expect(urlResult).toBe('https://example.com/screenshots/test123.png');
      expect(deleteResult).toBeUndefined();
      expect(mockStrategy.save).toHaveBeenCalledTimes(1);
      expect(mockStrategy.getUrl).toHaveBeenCalledTimes(1);
      expect(mockStrategy.delete).toHaveBeenCalledTimes(1);
    });
  });
});