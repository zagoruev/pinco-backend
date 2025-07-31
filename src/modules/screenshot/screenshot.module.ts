import { Global, Module } from '@nestjs/common';

import { SCREENSHOT_STRATEGY, ScreenshotService } from './screenshot.service';
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
