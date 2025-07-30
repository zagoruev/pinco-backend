import { Injectable, Inject } from '@nestjs/common';
import { ScreenshotStrategy } from './strategies/screenshot-strategy.interface';
import { Comment } from '../comment/comment.entity';

export const SCREENSHOT_STRATEGY = 'SCREENSHOT_STRATEGY';

@Injectable()
export class ScreenshotService {
  constructor(
    @Inject(SCREENSHOT_STRATEGY)
    private strategy: ScreenshotStrategy,
  ) {}

  async save(file: Express.Multer.File, comment: Comment): Promise<string> {
    return this.strategy.save(file, comment);
  }

  getUrl(comment: Comment): string {
    return this.strategy.getUrl(comment);
  }

  async delete(comment: Comment): Promise<void> {
    return this.strategy.delete(comment);
  }
}
