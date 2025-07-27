import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateSecretToken(userId: number, siteId: number): Promise<string> {
    const secret = this.jwtService.sign(
      {
        userId,
        siteId,
      },
      {
        secret: this.configService.get('app.jwtSecret'),
      },
    );

    await this.userRepository.update(userId, {
      secret_token: secret,
      secret_expires: null,
    });

    return secret;
  }

  async validateSecretToken(secret: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { secret_token: secret, active: true },
    });

    return user;
  }

  async revokeSecretToken(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      secret_token: null,
      secret_expires: null,
    });
  }
}
