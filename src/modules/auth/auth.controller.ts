import { Controller, Post, Get, Body, Query, Res, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SecretLoginDto } from './dto/secret-login.dto';

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
    const { token } = await this.authService.login(loginDto);
    
    this.setAuthCookie(response, token);
    
    return { message: 'Login successful' };
  }

  @Get('login')
  @ApiOperation({ summary: 'Login with secret token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid secret token' })
  async loginWithSecret(
    @Query() { secret }: SecretLoginDto,
    @Res() response: Response,
  ) {
    if (!secret) {
      throw new UnauthorizedException('Secret token is required');
    }

    const { token, user } = await this.authService.loginWithSecret(secret);
    
    this.setAuthCookie(response, token);
    
    // Redirect to the user's first site or a default URL
    const redirectUrl = '/'; // You may want to make this configurable
    response.redirect(redirectUrl);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear cookies' })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('auth-token');
    return { message: 'Logout successful' };
  }

  private setAuthCookie(response: Response, token: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookie('auth-token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      signed: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}