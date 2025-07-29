import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CookieAuthGuard } from 'src/common/guards/cookie-auth.guard';
import { OptionalAuth } from 'src/common/decorators/optional-auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RequestUser } from 'src/types/express';
// import { OriginGuard } from 'src/common/guards/origin.guard';

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
  getWidgetScript(@Query('key') key: string, @CurrentUser() user: RequestUser) {
    return this.widgetService.generateWidgetScript(key, user);
  }
}
