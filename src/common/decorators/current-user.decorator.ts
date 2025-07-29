import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from '../../types/express';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
