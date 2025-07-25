import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { customAlphabet } from 'nanoid';

const generateSecret = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 24);

@Injectable()
export class SecretService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async generateSecretToken(userId: number): Promise<string> {
    const secret = generateSecret();
    
    await this.userRepository.update(userId, {
      secret_token: secret,
      secret_expires: null, // Persistent token as per requirements
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