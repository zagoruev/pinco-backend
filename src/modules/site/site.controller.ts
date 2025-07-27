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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { AddUserToSiteDto } from './dto/add-user-to-site.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('sites')
@Controller('sites')
@UseGuards(CookieAuthGuard, RolesGuard)
@Roles(UserRole.ROOT)
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new site' })
  @ApiResponse({ status: 201, description: 'Site created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Site with this domain already exists',
  })
  create(@Body() createSiteDto: CreateSiteDto) {
    return this.siteService.create(createSiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sites' })
  @ApiResponse({ status: 200, description: 'Return all sites' })
  findAll() {
    return this.siteService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a site by id' })
  @ApiResponse({ status: 200, description: 'Return the site' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.findOne(id);
  }

  @Patch(':id')
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
  @ApiOperation({ summary: 'Delete a site' })
  @ApiResponse({ status: 200, description: 'Site deleted successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.remove(id);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get all users for a site' })
  @ApiResponse({ status: 200, description: 'Return all users for the site' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  getSiteUsers(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.getSiteUsers(id);
  }

  @Post(':id/users')
  @ApiOperation({ summary: 'Add a user to a site with specific roles' })
  @ApiResponse({ status: 200, description: 'User added to site successfully' })
  @ApiResponse({ status: 404, description: 'Site or user not found' })
  @ApiResponse({ status: 409, description: 'User already connected to site' })
  addUserToSite(
    @Param('id', ParseIntPipe) id: number,
    @Body() addUserToSiteDto: AddUserToSiteDto,
  ) {
    return this.siteService.addUserToSite(id, addUserToSiteDto);
  }

  @Patch(':id/users/:userId')
  @ApiOperation({ summary: 'Update user roles for a site' })
  @ApiResponse({ status: 200, description: 'User roles updated successfully' })
  @ApiResponse({ status: 404, description: 'Site or user not found' })
  updateUserRoles(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserRolesDto: UpdateUserRolesDto,
  ) {
    return this.siteService.updateUserRoles(id, userId, updateUserRolesDto);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({ summary: 'Remove a user from a site' })
  @ApiResponse({
    status: 200,
    description: 'User removed from site successfully',
  })
  @ApiResponse({ status: 404, description: 'Site or user not found' })
  removeUserFromSite(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.siteService.removeUserFromSite(id, userId);
  }
}
