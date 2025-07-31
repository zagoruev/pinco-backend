import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Site } from '../site/site.entity';
import { SiteModule } from '../site/site.module';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';

@Module({
  imports: [TypeOrmModule.forFeature([Site]), SiteModule, ConfigModule],
  controllers: [WidgetController],
  providers: [WidgetService],
  exports: [WidgetService],
})
export class WidgetModule {}
