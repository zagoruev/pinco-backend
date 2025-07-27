import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReplyService } from './reply.service';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { ReplyResponse } from './dto/reply-response.dto';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSite } from '../../common/decorators/current-site.decorator';
import { Site } from '../site/site.entity';
import { RequestUser } from '../../types/express';

@ApiTags('replies')
@Controller('replies')
@UseGuards(CookieAuthGuard, OriginGuard)
export class ReplyController {
  constructor(private readonly replyService: ReplyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all replies for current site' })
  @ApiResponse({ status: 200, description: 'Returns all replies' })
  async findAll(@CurrentSite() site: Site): Promise<ReplyResponse[]> {
    return this.replyService.findAll(site);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new reply' })
  @ApiResponse({ status: 201, description: 'Reply created successfully' })
  async create(
    @Body() createDto: CreateReplyDto,
    @CurrentSite() site: Site,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<ReplyResponse> {
    return this.replyService.create(createDto, site, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reply' })
  @ApiResponse({ status: 200, description: 'Reply updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReplyDto,
    @CurrentSite() site: Site,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<ReplyResponse> {
    return this.replyService.update(Number(id), updateDto, site, currentUser);
  }
}
