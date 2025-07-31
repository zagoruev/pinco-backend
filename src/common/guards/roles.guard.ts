import { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { TokenPayload } from '../../modules/auth/token.service';
import { UserRole } from '../../modules/user/user.entity';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as TokenPayload;
    if (!user || !user.roles) {
      return false;
    }

    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
