import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Site } from '../../modules/site/site.entity';

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { user, headers } = request;
    const origin = headers.origin ?? headers.referer;

    if (!origin) {
      throw new ForbiddenException('Origin not provided');
    }

    const url = new URL(origin);
    const domain = url.hostname;

    const site = await this.siteRepository.findOne({
      where: { domain, active: true },
    });

    if (!site) {
      throw new ForbiddenException('Invalid or inactive site');
    }

    const canAccessSite = user?.sites.some(
      (userSite) => userSite.site_id === site.id,
    );

    if (!canAccessSite) {
      throw new ForbiddenException('User does not have access to this site');
    }

    request.site = site;

    return true;
  }
}
