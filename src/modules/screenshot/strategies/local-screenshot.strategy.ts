import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ScreenshotStrategy } from './screenshot-strategy.interface';

@Injectable()
export class LocalScreenshotStrategy implements ScreenshotStrategy {
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseDir =
      this.configService.get('screenshot.baseDir') || './screenshots';
    this.baseUrl =
      this.configService.get('screenshot.baseUrl') ||
      'http://localhost:3000/screenshots';
  }

  async save(file: Express.Multer.File, filename: string): Promise<string> {
    const filePath = path.join(this.baseDir, filename);

    // Ensure directory exists
    await fs.mkdir(this.baseDir, { recursive: true });

    // Save file
    await fs.writeFile(filePath, file.buffer);

    return filename;
  }

  getUrl(filename: string): string {
    return `${this.baseUrl}/${filename}`;
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(this.baseDir, filename);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
