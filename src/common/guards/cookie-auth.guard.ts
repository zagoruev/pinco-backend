import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
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
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<RequestWithToken>();
    const token = this.extractTokenFromCookie(request, isOptional);

    if (!token && isOptional) {
      return true;
    }

    try {
      const user = this.tokenService.verifyToken(token!);
      const sites = await this.siteService.getUserSites(user.id);

      request.user = {
        ...user,
        sites,
      };
      return true;
    } catch {
      if (isOptional) {
        return true;
      }
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromCookie(
    request: RequestWithToken,
    isOptional?: boolean,
  ): string | null {
    const token = request.signedCookies.token;

    if (!token) {
      if (isOptional) {
        return null;
      }
      throw new UnauthorizedException('No authentication token found');
    }

    return token;
  }
}
