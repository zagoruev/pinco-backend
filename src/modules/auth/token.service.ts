import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AppConfigService } from '../config/config.service';
import { User } from '../user/user.entity';

export interface TokenPayload {
  id: number;
  email: string;
  roles: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: AppConfigService,
  ) {}

  signToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('app.authSecret'),
      expiresIn: this.configService.get('app.authTokenExpiresIn'),
    });
  }

  verifyToken(token: string): TokenPayload {
    const payload = this.jwtService.verify<TokenPayload>(token, {
      secret: this.configService.get('app.authSecret'),
    });

    if (!payload.id) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return {
      id: Number(payload.id),
      email: payload.email,
      roles: payload.roles,
    };
  }
}
