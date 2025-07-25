import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../../modules/site/site.entity';

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const origin = request.headers.origin || request.headers.referer;
    const user = request.user;

    if (!origin) {
      throw new ForbiddenException('Origin not provided');
    }

    // Extract domain from origin
    const url = new URL(origin);
    const domain = url.hostname;

    // Check if site exists and is active
    const site = await this.siteRepository.findOne({
      where: { domain, active: true },
    });

    if (!site) {
      throw new ForbiddenException('Invalid or inactive site');
    }

    // Check if user has access to this site
    if (user.sites && !user.sites.includes(site.id)) {
      throw new ForbiddenException('User does not have access to this site');
    }

    // Add site to request for later use
    request['site'] = site;

    return true;
  }
}