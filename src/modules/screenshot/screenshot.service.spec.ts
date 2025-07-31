import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalScreenshotStrategy } from './strategies/local-screenshot.strategy';
import { AppConfigService } from '../config/config.service';
import { Comment } from '../comment/comment.entity';
import { User } from '../user/user.entity';
import { Site } from '../site/site.entity';

jest.mock('fs/promises');

describe('LocalScreenshotStrategy', () => {
  let strategy: LocalScreenshotStrategy;
  let configService: AppConfigService;

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

  const mockComment = {
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
  } as Comment;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalScreenshotStrategy,
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                'screenshot.baseDir': './test-screenshots',
                'screenshot.baseUrl': 'http://test.com/screenshots',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalScreenshotStrategy>(LocalScreenshotStrategy);
    configService = module.get<AppConfigService>(AppConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a file', async () => {
      const file = {
        buffer: Buffer.from('test image data'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const result = await strategy.save(file, mockComment);

      expect(result).toBe('test123.png');
      expect(fs.mkdir).toHaveBeenCalledWith('./test-screenshots', {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('./test-screenshots', 'test123.png'),
        file.buffer,
      );
    });
  });

  describe('getUrl', () => {
    it('should return the full URL for a comment', () => {
      const result = strategy.getUrl(mockComment);

      expect(result).toBe('http://test.com/screenshots/test123.png');
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      jest.spyOn(fs, 'unlink').mockResolvedValue();

      await strategy.delete(mockComment);

      expect(fs.unlink).toHaveBeenCalledWith(
        path.join('./test-screenshots', 'test123.png'),
      );
    });

    it('should ignore ENOENT errors when file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';

      jest.spyOn(fs, 'unlink').mockRejectedValue(error);

      await expect(strategy.delete(mockComment)).resolves.not.toThrow();
    });

    it('should throw other errors', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';

      jest.spyOn(fs, 'unlink').mockRejectedValue(error);

      await expect(strategy.delete(mockComment)).rejects.toThrow(
        'Permission denied',
      );
    });
  });
});
