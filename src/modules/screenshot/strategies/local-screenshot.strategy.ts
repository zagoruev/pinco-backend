import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ScreenshotStrategy } from './screenshot-strategy.interface';
import { Comment } from '../../comment/comment.entity';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class LocalScreenshotStrategy implements ScreenshotStrategy {
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(private configService: AppConfigService) {
    this.baseDir = this.configService.get('screenshot.baseDir');
    this.baseUrl = this.configService.get('screenshot.baseUrl');
  }

  async save(file: Express.Multer.File, comment: Comment): Promise<string> {
    const filename = `${comment.uniqid}.png`;
    const filePath = path.join(this.baseDir, filename);

    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    return filename;
  }

  getUrl(comment: Comment): string {
    const filename = `${comment.uniqid}.png`;
    return `${this.baseUrl}/${filename}`;
  }

  async delete(comment: Comment): Promise<void> {
    const filename = `${comment.uniqid}.png`;
    const filePath = path.join(this.baseDir, filename);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
