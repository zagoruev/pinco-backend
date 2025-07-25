import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Site } from '../../modules/site/site.entity';

export const CurrentSite = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Site => {
    const request = ctx.switchToHttp().getRequest();
    return request.site;
  },
);