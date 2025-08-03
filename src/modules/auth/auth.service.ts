import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Repository } from 'typeorm';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppConfigService } from '../config/config.service';
import { Site } from '../site/site.entity';
import { UserSiteService } from '../user/user-site.service';
import { User, UserRole } from '../user/user.entity';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tokenService: TokenService,
    private userSiteService: UserSiteService,
    private configService: AppConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, active: true },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const allowedRoles = [UserRole.ROOT, UserRole.ADMIN];
    const hasAllowedRole = user.roles.some((role) => allowedRoles.includes(role));

    if (!hasAllowedRole) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: User }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.tokenService.signToken(user);
    return { token, user };
  }

  async loginWithInvite(invite: string): Promise<{ token: string; user: User; site: Site }> {
    const { user, userSite } = await this.userSiteService.validateInviteToken(invite);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired invite token');
    }

    const token = this.tokenService.signToken(user);

    return { token, user, site: userSite.site };
  }

  setAuthCookie(response: Response, token: string) {
    const maxAge = this.configService.get('app.authTokenExpiresIn');

    response.cookie('token', token, {
      httpOnly: true,
      secure: true,
      signed: true,
      sameSite: 'none',
      maxAge,
    });
  }
}
