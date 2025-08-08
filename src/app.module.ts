import * as path from 'path';

import { Module } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { CommentModule } from './modules/comment/comment.module';
import { AppConfigModule } from './modules/config/config.module';
import { AppConfigService } from './modules/config/config.service';
import { HealthModule } from './modules/health/health.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReplyModule } from './modules/reply/reply.module';
import { ScreenshotModule } from './modules/screenshot/screenshot.module';
import { SiteModule } from './modules/site/site.module';
import { UserModule } from './modules/user/user.module';
import { WidgetModule } from './modules/widget/widget.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (configService: AppConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        migrations: ['dist/migrations/*{.ts,.js}'],
        synchronize: false,
      }),
      inject: [AppConfigService],
    }),
    EventEmitterModule.forRoot(),
    ...(process.env.SCREENSHOT_SERVE_LOCAL === 'true'
      ? [
          ServeStaticModule.forRootAsync({
            imports: [AppConfigModule],
            useFactory: (configService: AppConfigService) => [
              {
                rootPath: path.join(__dirname, '..', configService.get('screenshot.baseDir')),
                serveRoot: '/screenshots',
                serveStaticOptions: {
                  index: false,
                },
              },
            ],
            inject: [AppConfigService],
          }),
        ]
      : []),
    HealthModule,
    AuthModule,
    SiteModule,
    UserModule,
    ScreenshotModule,
    CommentModule,
    ReplyModule,
    NotificationModule,
    WidgetModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule {}
