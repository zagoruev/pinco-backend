import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalScreenshotStrategy } from './strategies/local-screenshot.strategy';

jest.mock('fs/promises');

describe('LocalScreenshotStrategy', () => {
  let strategy: LocalScreenshotStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalScreenshotStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
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
    configService = module.get<ConfigService>(ConfigService);
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
      const filename = 'test123.jpg';

      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const result = await strategy.save(file, filename);

      expect(result).toBe(filename);
      expect(fs.mkdir).toHaveBeenCalledWith('./test-screenshots', {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('./test-screenshots', filename),
        file.buffer,
      );
    });
  });

  describe('getUrl', () => {
    it('should return the full URL for a filename', () => {
      const filename = 'test123.jpg';
      const result = strategy.getUrl(filename);

      expect(result).toBe('http://test.com/screenshots/test123.jpg');
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      const filename = 'test123.jpg';
      jest.spyOn(fs, 'unlink').mockResolvedValue();

      await strategy.delete(filename);

      expect(fs.unlink).toHaveBeenCalledWith(
        path.join('./test-screenshots', filename),
      );
    });

    it('should ignore ENOENT errors when file does not exist', async () => {
      const filename = 'nonexistent.jpg';
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';

      jest.spyOn(fs, 'unlink').mockRejectedValue(error);

      await expect(strategy.delete(filename)).resolves.not.toThrow();
    });

    it('should throw other errors', async () => {
      const filename = 'test123.jpg';
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';

      jest.spyOn(fs, 'unlink').mockRejectedValue(error);

      await expect(strategy.delete(filename)).rejects.toThrow(
        'Permission denied',
      );
    });
  });
});
