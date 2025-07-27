import { Module, Global } from '@nestjs/common';
import { ScreenshotService, SCREENSHOT_STRATEGY } from './screenshot.service';
import { LocalScreenshotStrategy } from './strategies/local-screenshot.strategy';

@Global()
@Module({
  providers: [
    {
      provide: SCREENSHOT_STRATEGY,
      useClass: LocalScreenshotStrategy,
    },
    ScreenshotService,
  ],
  exports: [ScreenshotService],
})
export class ScreenshotModule {}
