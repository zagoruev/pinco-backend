import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig, databaseConfig, emailConfig, screenshotConfig } from '../../config';
import { AppConfigService } from './config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, databaseConfig, emailConfig, screenshotConfig],
      expandVariables: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
