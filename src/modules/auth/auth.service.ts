import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User, UserRole } from '../user/user.entity';
import { UserSite } from '../user/user-site.entity';
import { TokenService } from './token.service';
import { SecretService } from './secret.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSite)
    private userSiteRepository: Repository<UserSite>,
    private tokenService: TokenService,
    private secretService: SecretService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, active: true },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return null;
    }

    const allowedRoles = [UserRole.ROOT, UserRole.ADMIN];
    const hasAllowedRole = user.roles.some((role) =>
      allowedRoles.includes(role),
    );

    if (!hasAllowedRole) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: User }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.tokenService.signToken(user);
    return { token, user };
  }

  async loginWithSecret(
    secret: string,
  ): Promise<{ token: string; user: User }> {
    const user = await this.secretService.validateSecretToken(secret);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired secret token');
    }

    const token = this.tokenService.signToken(user);

    return { token, user };
  }
}
