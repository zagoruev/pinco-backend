import { ConfigModule } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './config.service';
import {
  appConfig,
  databaseConfig,
  emailConfig,
  screenshotConfig,
} from 'src/config';

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
