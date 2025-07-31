import * as cookieParser from 'cookie-parser';

import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AppConfigService } from './modules/config/config.service';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);

  const url = configService.get('app.url');
  const apiPrefix = configService.get('app.apiPrefix');
  const port = configService.get('app.port');

  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(cookieParser(configService.get('app.authSecret')));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  if (configService.get('app.isDev')) {
    const config = new DocumentBuilder()
      .setTitle('Pinco Backend API')
      .setDescription('The annotation widget backend API')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);

  console.log(`Application is running on: ${url}/${apiPrefix}`);
}

if (require.main === module) {
  void bootstrap();
}
