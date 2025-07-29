import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../../modules/auth/token.service';
import { SiteService } from '../../modules/site/site.service';

type RequestWithToken = Request & {
  signedCookies: {
    token?: string;
    [key: string]: unknown;
  };
};

@Injectable()
export class CookieAuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private siteService: SiteService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithToken>();
    const token = this.extractTokenFromCookie(request);

    try {
      const user = this.tokenService.verifyToken(token);
      const sites = await this.siteService.getUserSites(user.sub);

      request.user = {
        ...user,
        sites,
      };
      return true;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromCookie(request: RequestWithToken): string {
    const token = request.signedCookies.token;

    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    return token;
  }
}
