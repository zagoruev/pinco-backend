import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { VersioningType, ClassSerializerInterceptor } from '@nestjs/common';
import { AppConfigService } from './modules/config/config.service';

async function bootstrap() {
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

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Pinco Backend API')
      .setDescription('The annotation widget backend API')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);

  console.log(`Application is running on: ${url}${apiPrefix}`);
}

void bootstrap();
