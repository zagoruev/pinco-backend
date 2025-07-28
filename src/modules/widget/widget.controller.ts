import { Controller, Get, Header, Query } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller({
  version: VERSION_NEUTRAL,
})
@ApiTags('widget')
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
  getWidgetScript(@Query('key') key: string) {
    return this.widgetService.generateWidgetScript(key);
  }
}
