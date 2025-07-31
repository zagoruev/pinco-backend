import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../types/express';
import { OriginGuard } from '../../common/guards/origin.guard';
@Controller({
  version: VERSION_NEUTRAL,
})
@ApiTags('widget')
@UseGuards(CookieAuthGuard, OriginGuard)
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
  getWidgetScript(@Query('key') key: string, @CurrentUser() user: RequestUser) {
    return this.widgetService.generateWidgetScript(key, user);
  }
}
