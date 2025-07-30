import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  SerializeOptions,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './site.entity';

@ApiTags('sites')
@Controller('sites')
@UseGuards(CookieAuthGuard, RolesGuard)
export class SiteController {
  constructor(
    private readonly siteService: SiteService,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
  ) {}

  @Post()
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Create a new site' })
  @ApiResponse({ status: 201, description: 'Site created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Site with this domain already exists',
  })
  create(@Body() createSiteDto: CreateSiteDto) {
    return this.siteService.create(createSiteDto);
  }

  @Get('list')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Get all sites' })
  @ApiResponse({ status: 200, description: 'Return all sites' })
  list() {
    return this.siteRepository.find({ order: { created: 'DESC' } });
  }

  @Get(':id')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Get a site by id' })
  @ApiResponse({ status: 200, description: 'Return the site' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.siteRepository.findOneOrFail({ where: { id } });
  }

  @Patch(':id')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Update a site' })
  @ApiResponse({ status: 200, description: 'Site updated successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  @ApiResponse({
    status: 409,
    description: 'Site with this domain already exists',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.siteService.update(id, updateSiteDto);
  }

  @Delete(':id')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Delete a site' })
  @ApiResponse({ status: 200, description: 'Site deleted successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.remove(id);
  }

  @Get(':id/users')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Get all users for a site' })
  @ApiResponse({ status: 200, description: 'Return all users for the site' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  getSiteUsers(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.getSiteUsers(id);
  }
}
