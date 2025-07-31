import { Repository } from 'typeorm';

import { Body, Controller, Get, Param, Post, SerializeOptions, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { CurrentSite } from '../../common/decorators/current-site.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../types/express';
import { Site } from '../site/site.entity';
import { UserRole } from '../user/user.entity';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { Reply } from './reply.entity';
import { ReplyService } from './reply.service';

@ApiTags('replies')
@Controller('replies')
@UseGuards(CookieAuthGuard)
export class ReplyController {
  constructor(
    private readonly replyService: ReplyService,
    @InjectRepository(Reply)
    private replyRepository: Repository<Reply>,
  ) {}

  @Get()
  @SerializeOptions({ groups: ['widget'] })
  @UseGuards(OriginGuard)
  @ApiOperation({ summary: 'Get all replies for current site' })
  @ApiResponse({ status: 200, description: 'Returns all replies' })
  findAll(@CurrentSite() site: Site) {
    return this.replyService.findAll(site);
  }

  @Get('list')
  @UseGuards(RolesGuard)
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Get all replies for current site' })
  @ApiResponse({ status: 200, description: 'Returns all replies' })
  list() {
    return this.replyRepository.find();
  }

  @Post()
  @SerializeOptions({ groups: ['widget'] })
  @UseGuards(OriginGuard)
  // @TODO: Remove this once we use multipart only for file uploads
  @UseInterceptors(FileInterceptor(''))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new reply' })
  @ApiBody({ type: CreateReplyDto })
  @ApiResponse({ status: 201, description: 'Reply created successfully' })
  create(@Body() createDto: CreateReplyDto, @CurrentSite() site: Site, @CurrentUser() currentUser: RequestUser) {
    return this.replyService.create(createDto, site, currentUser);
  }

  @Post(':id')
  @SerializeOptions({ groups: ['widget'] })
  @UseGuards(OriginGuard)
  // @TODO: Remove this once we use multipart only for file uploads
  @UseInterceptors(FileInterceptor(''))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a reply' })
  @ApiBody({ type: UpdateReplyDto })
  @ApiResponse({ status: 200, description: 'Reply updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReplyDto,
    @CurrentSite() site: Site,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.replyService.update(Number(id), updateDto, site, currentUser);
  }
}
