import { Injectable, Inject } from '@nestjs/common';
import { ScreenshotStrategy } from './strategies/screenshot-strategy.interface';

export const SCREENSHOT_STRATEGY = 'SCREENSHOT_STRATEGY';

@Injectable()
export class ScreenshotService {
  constructor(
    @Inject(SCREENSHOT_STRATEGY)
    private strategy: ScreenshotStrategy,
  ) {}

  async save(file: Express.Multer.File, filename: string): Promise<string> {
    return this.strategy.save(file, filename);
  }

  getUrl(filename: string): string {
    return this.strategy.getUrl(filename);
  }

  async delete(filename: string): Promise<void> {
    return this.strategy.delete(filename);
  }
}
