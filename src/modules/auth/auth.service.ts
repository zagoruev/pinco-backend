import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User, UserRole } from '../user/user.entity';
import { TokenService } from './token.service';
import { LoginDto } from './dto/login.dto';
import { UserSiteService } from '../user/user-site.service';
import { UserSite } from '../user/user-site.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tokenService: TokenService,
    private userSiteService: UserSiteService,
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

  async loginWithInvite(
    invite: string,
  ): Promise<{ token: string; user: User; userSite: UserSite }> {
    const { user, userSite } =
      await this.userSiteService.validateInviteToken(invite);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired invite token');
    }

    const token = this.tokenService.signToken(user);

    return { token, user, userSite };
  }
}
