import { Repository } from 'typeorm';

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  SerializeOptions,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import { Comment } from './comment.entity';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('comments')
@Controller('comments')
@UseGuards(CookieAuthGuard)
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  @Get()
  @SerializeOptions({ groups: ['widget', 'backoffice'] })
  @UseGuards(OriginGuard)
  @ApiOperation({ summary: 'Get all comments for current site' })
  @ApiResponse({ status: 200, description: 'Return all comments' })
  findAll(@CurrentSite() site: Site, @CurrentUser() currentUser: RequestUser) {
    return this.commentService.findAll(site, currentUser);
  }

  @Get('list')
  @UseGuards(RolesGuard)
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Get all comments for the current user' })
  @ApiResponse({ status: 200, description: 'Return all comments' })
  list() {
    return this.commentRepository.find();
  }

  @Post()
  @SerializeOptions({ groups: ['widget'] })
  @UseGuards(OriginGuard)
  @UseInterceptors(FileInterceptor('screenshot'))
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  create(
    @Body() createCommentDto: CreateCommentDto,
    @UploadedFile() screenshot: Express.Multer.File,
    @CurrentSite() site: Site,
    @CurrentUser() currentUser: RequestUser,
  ) {
    if (screenshot) {
      createCommentDto.screenshot = screenshot;
    }
    return this.commentService.create(createCommentDto, site, currentUser);
  }

  @Post(':id')
  @SerializeOptions({ groups: ['widget'] })
  @UseGuards(OriginGuard)
  @UseInterceptors(FileInterceptor(''))
  @ApiOperation({ summary: 'Update a comment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentSite() site: Site,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.commentService.update(id, updateCommentDto, site, currentUser);
  }

  @Get(':id/view')
  @SerializeOptions({ groups: ['widget'] })
  @UseGuards(OriginGuard)
  @ApiOperation({ summary: 'Mark comment as viewed by user' })
  @ApiResponse({ status: 200, description: 'Comment marked as viewed' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  markAsViewed(
    @Param('id', ParseIntPipe) id: number,
    @CurrentSite() site: Site,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.commentService.markAsViewed(id, site, currentUser);
  }

  @Get(':id/unview')
  @SerializeOptions({ groups: ['widget'] })
  @UseGuards(OriginGuard)
  @ApiOperation({ summary: 'Mark comment as unviewed by user' })
  @ApiResponse({ status: 200, description: 'Comment marked as unviewed' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  markAsUnviewed(
    @Param('id', ParseIntPipe) id: number,
    @CurrentSite() site: Site,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.commentService.markAsUnviewed(id, site, currentUser);
  }

  @Get('view-all')
  @SerializeOptions({ groups: ['widget'] })
  @UseGuards(OriginGuard)
  @ApiOperation({ summary: 'Mark all site comments as viewed by user' })
  @ApiResponse({ status: 200, description: 'All comments marked as viewed' })
  markAllAsViewed(@CurrentSite() site: Site, @CurrentUser() currentUser: RequestUser) {
    return this.commentService.markAllAsViewed(site, currentUser);
  }
}
