import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReplyService } from './reply.service';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentSite } from '../../common/decorators/current-site.decorator';
import { Site } from '../site/site.entity';
import { RequestUser } from '../../types/express';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('replies')
@Controller('replies')
@UseGuards(CookieAuthGuard)
export class ReplyController {
  constructor(private readonly replyService: ReplyService) {}

  @Get()
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
  list(
    @CurrentUser() currentUser: RequestUser,
    @Query('siteId', new ParseIntPipe({ optional: true })) siteId?: number,
  ) {
    return this.replyService.listReplies(currentUser, siteId);
  }

  @Post()
  @UseGuards(OriginGuard)
  // @TODO: Remove this once we use multipart only for file uploads
  @UseInterceptors(FileInterceptor(''))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new reply' })
  @ApiBody({ type: CreateReplyDto })
  @ApiResponse({ status: 201, description: 'Reply created successfully' })
  create(
    @Body() createDto: CreateReplyDto,
    @CurrentSite() site: Site,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.replyService.create(createDto, site, currentUser);
  }

  @Post(':id')
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
