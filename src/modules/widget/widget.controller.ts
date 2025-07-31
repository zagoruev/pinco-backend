import { Request } from 'express';

import { Controller, Get, Header, Query, Req, UseGuards } from '@nestjs/common';
import { VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { RequestUser } from '../../types/express';
import { WidgetService } from './widget.service';

@Controller({
  version: VERSION_NEUTRAL,
})
@ApiTags('widget')
@UseGuards(CookieAuthGuard)
@OptionalAuth()
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Get('widget.js')
  @Header('Content-Type', 'application/javascript')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET')
  @Header('Access-Control-Allow-Headers', 'Content-Type')
  @Header('Access-Control-Allow-Credentials', 'true')
  @ApiOperation({ summary: 'Get widget script' })
  @ApiResponse({ status: 200, description: 'Return widget script' })
  getWidgetScript(@Query('key') key: string, @CurrentUser() user: RequestUser, @Req() request: Request) {
    return this.widgetService.generateWidgetScript(key, user, request);
  }
}
