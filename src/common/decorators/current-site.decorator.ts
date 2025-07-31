import { Request } from 'express';

import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const CurrentSite = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.site;
});
