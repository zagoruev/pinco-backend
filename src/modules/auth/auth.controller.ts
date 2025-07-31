import { Response } from 'express';

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { InviteLoginDto } from './dto/invite-login.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password (Admin/Owner only)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.authService.login(loginDto);

    this.authService.setAuthCookie(response, token);

    return { user: user.id };
  }

  @Get('login')
  @ApiOperation({ summary: 'Login with invite token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid invite token' })
  async loginWithInvite(@Query() { invite }: InviteLoginDto, @Res() response: Response) {
    const { token, site } = await this.authService.loginWithInvite(invite);

    this.authService.setAuthCookie(response, token);

    response.redirect(site.url);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear cookies' })
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token');
    return { message: 'Logout successful' };
  }
}
