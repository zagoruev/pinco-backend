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
  SerializeOptions,
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
import { UserSiteService } from './user-site.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { RevokeInviteDto } from './dto/revoke-invite.dto';
import { ResendInviteDto } from './dto/resend-invite.dto';
import { DeleteInviteDto } from './dto/delete-invite.dto';
import { UpdateUserSiteRolesDto } from './dto/update-user-site-roles.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(CookieAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userSiteService: UserSiteService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Return current user' })
  async getCurrentUser(@CurrentUser() currentUser: RequestUser) {
    const user = await this.userService.findOne(currentUser.id, currentUser);
    return user;
  }

  @Post()
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
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
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Get all site users' })
  @ApiResponse({ status: 200, description: 'Return all site users' })
  listAll(
    @CurrentUser() currentUser: RequestUser,
    @Query('siteId', new ParseIntPipe({ optional: true })) siteId?: number,
  ) {
    return this.userService.listUsers(currentUser, siteId);
  }

  @Get(':id')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
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
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
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
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
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

  @Post('invite')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Send or resend invite to user' })
  @ApiResponse({ status: 200, description: 'Invite sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  invite(@Body() inviteUserDto: InviteUserDto) {
    return this.userSiteService.addUserToSite(
      inviteUserDto.user_id,
      inviteUserDto.site_id,
      inviteUserDto.roles,
      inviteUserDto.invite,
    );
  }

  @Patch('invite/update')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Update user invite' })
  @ApiResponse({ status: 200, description: 'Invite updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateInvite(@Body() updateInviteDto: UpdateUserSiteRolesDto) {
    return this.userSiteService.updateUserSiteRoles(
      updateInviteDto.user_id,
      updateInviteDto.site_id,
      updateInviteDto.roles,
    );
  }

  @Post('invite/delete')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Delete user invite' })
  @ApiResponse({ status: 200, description: 'Invite deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteInvite(@Body() deleteInviteDto: DeleteInviteDto) {
    return this.userSiteService.removeUserFromSite(
      deleteInviteDto.user_id,
      deleteInviteDto.site_id,
    );
  }

  @Post('invite/resend')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Resend invite to user' })
  @ApiResponse({ status: 200, description: 'Invite resent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resendInvite(@Body() resendInviteDto: ResendInviteDto) {
    return this.userSiteService.inviteUser(
      resendInviteDto.user_id,
      resendInviteDto.site_id,
    );
  }

  @Post('invite/revoke')
  @SerializeOptions({ groups: ['backoffice'] })
  @Roles(UserRole.ROOT)
  @ApiOperation({ summary: 'Revoke user invite' })
  @ApiResponse({ status: 200, description: 'Invite revoked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  revokeInvite(@Body() revokeInviteDto: RevokeInviteDto) {
    return this.userSiteService.revokeInvite(
      revokeInviteDto.user_id,
      revokeInviteDto.site_id,
    );
  }
}
