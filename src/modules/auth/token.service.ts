import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';

export interface TokenPayload {
  sub: number;
  email: string;
  roles: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  signToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('app.jwtSecret'),
      expiresIn: this.configService.get('app.jwtExpiresIn'),
    });
  }

  verifyToken(token: string): TokenPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get('app.jwtSecret'),
    });
  }
}
