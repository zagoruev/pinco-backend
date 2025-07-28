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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../user/user.entity';
import { RequestUser } from 'src/types/express';
import { CurrentSite } from 'src/common/decorators/current-site.decorator';
import { Site } from '../site/site.entity';
import { OriginGuard } from 'src/common/guards/origin.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(CookieAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Return current user' })
  async getCurrentUser(@CurrentUser() currentUser: RequestUser) {
    const user = await this.userService.findOne(currentUser.sub, currentUser);
    return user;
  }

  @Post()
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({
    status: 409,
    description: 'User with this email or username already exists',
  })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.userService.create(createUserDto, currentUser);
  }

  @Get()
  @UseGuards(OriginGuard)
  @ApiOperation({ summary: 'Get all site users' })
  @ApiResponse({ status: 200, description: 'Return all site users' })
  findAll(@CurrentSite() site: Site, @CurrentUser() currentUser: RequestUser) {
    return this.userService.findAll(currentUser, site.id);
  }

  @Get('list')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all site users' })
  @ApiResponse({ status: 200, description: 'Return all site users' })
  listAll(
    @CurrentUser() currentUser: RequestUser,
    @Query('siteId', new ParseIntPipe({ optional: true })) siteId?: number,
  ) {
    return this.userService.listUsers(currentUser, siteId);
  }

  @Get(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'Return the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.userService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({
    status: 409,
    description: 'User with this email or username already exists',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.userService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 400, description: 'Cannot delete your own account' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.userService.remove(id, currentUser);
  }

  @Post(':id/invite')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Send or resend invite to user' })
  @ApiResponse({ status: 200, description: 'Invite sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  invite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.userService.invite(id, currentUser);
  }

  @Delete(':id/invite')
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Revoke user invite' })
  @ApiResponse({ status: 200, description: 'Invite revoked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  revokeInvite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.userService.revokeInvite(id, currentUser);
  }
}
