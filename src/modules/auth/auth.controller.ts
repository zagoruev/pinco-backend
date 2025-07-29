import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { InviteLoginDto } from './dto/invite-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password (Admin/Owner only)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, user } = await this.authService.login(loginDto);

    this.setAuthCookie(response, token);

    return { user: user.id };
  }

  @Get('login')
  @ApiOperation({ summary: 'Login with invite token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid invite token' })
  async loginWithInvite(
    @Query() { invite }: InviteLoginDto,
    @Res() response: Response,
  ) {
    if (!invite) {
      throw new UnauthorizedException('Invite token is required');
    }

    const { token, userSite } = await this.authService.loginWithInvite(invite);

    this.setAuthCookie(response, token);

    response.redirect(userSite.site.url);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear cookies' })
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token');
    return { message: 'Logout successful' };
  }

  private setAuthCookie(response: Response, token: string) {
    response.cookie('token', token, {
      httpOnly: true,
      secure: true,
      signed: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}
