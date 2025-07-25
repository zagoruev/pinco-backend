import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';

export interface TokenPayload {
  sub: number;
  email: string;
  roles: string[];
  sites?: number[];
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signToken(user: User, sites?: number[]): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      sites,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('app.jwtSecret'),
      expiresIn: this.configService.get('app.jwtExpiresIn'),
    });
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verify(token, {
      secret: this.configService.get('app.jwtSecret'),
    });
  }
}