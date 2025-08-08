import { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { TokenService } from '../../modules/auth/token.service';
import { SiteService } from '../../modules/site/site.service';

type RequestWithToken = Request & {
  signedCookies: {
    token?: string;
    [key: string]: unknown;
  };
};

export const OPTIONAL_AUTH_KEY = 'optionalAuth';

@Injectable()
export class CookieAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tokenService: TokenService,
    private siteService: SiteService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOptional = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<RequestWithToken>();
    const token = this.extractTokenFromCookie(request);

    if (!token && isOptional) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      const user = this.tokenService.verifyToken(token);
      const sites = await this.siteService.getUserSites(user.id);

      request.user = {
        ...user,
        sites,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromCookie(request: RequestWithToken): string | undefined {
    return request.signedCookies.token;
  }
}
