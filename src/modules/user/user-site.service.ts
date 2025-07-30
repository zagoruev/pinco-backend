import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { UserSite, UserSiteRole } from './user-site.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Site } from '../site/site.entity';
import { AppConfigService } from '../config/config.service';

const generateUniqid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  13,
);

interface InviteTokenPayload {
  user_id: number;
  site_id: number;
  invite_code: string;
}

@Injectable()
export class UserSiteService {
  constructor(
    @InjectRepository(UserSite)
    private userSiteRepository: Repository<UserSite>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    private jwtService: JwtService,
    private configService: AppConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async addUserToSite(
    user_id: number,
    site_id: number,
    roles: UserSiteRole[],
    invite: boolean,
  ): Promise<void> {
    const userSite = await this.userSiteRepository.findOne({
      where: { user_id, site_id },
    });

    if (userSite) {
      throw new BadRequestException('User already has access to this site');
    }

    const invite_code = invite
      ? await this.generateInviteCode(user_id, site_id)
      : null;

    await this.userSiteRepository.save({
      user_id,
      site_id,
      roles,
      invite_code,
    });

    if (invite) {
      await this.inviteUser(user_id, site_id);
    }
  }

  async removeUserFromSite(user_id: number, site_id: number): Promise<void> {
    await this.userSiteRepository.delete({ user_id, site_id });
  }

  async inviteUser(user_id: number, site_id: number): Promise<void> {
    const invite_token = await this.generateInviteToken(user_id, site_id);
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    const site = await this.siteRepository.findOne({ where: { id: site_id } });

    this.eventEmitter.emit('user.invited', { user, site, invite_token });
  }

  async generateInviteToken(user_id: number, site_id: number): Promise<string> {
    const invite_code =
      (await this.getInviteCode(user_id, site_id)) ??
      (await this.generateInviteCode(user_id, site_id));

    return this.jwtService.sign(
      { user_id, site_id, invite_code },
      { secret: this.configService.get('app.authSecret') },
    );
  }

  async validateInviteToken(
    inviteToken: string,
  ): Promise<{ userSite: UserSite; user: User }> {
    const { user_id, site_id, invite_code } =
      this.jwtService.verify<InviteTokenPayload>(inviteToken, {
        secret: this.configService.get('app.authSecret'),
      });

    const userSite = await this.userSiteRepository.findOne({
      where: { user_id, site_id, invite_code },
      relations: ['site'],
    });
    const user = await this.userRepository.findOne({
      where: { id: user_id },
    });

    if (!userSite || !user) {
      throw new UnauthorizedException('Invalid invite token');
    }

    return { userSite, user };
  }

  async getInviteCode(
    user_id: number,
    site_id: number,
  ): Promise<string | null> {
    const userSite = await this.userSiteRepository.findOne({
      where: { user_id, site_id },
    });

    return userSite?.invite_code ?? null;
  }

  async generateInviteCode(user_id: number, site_id: number): Promise<string> {
    const invite_code = generateUniqid();

    await this.userSiteRepository.update({ user_id, site_id }, { invite_code });

    return invite_code;
  }

  async revokeInvite(user_id: number, site_id: number): Promise<void> {
    await this.userSiteRepository.update(
      { user_id, site_id },
      { invite_code: null },
    );
  }
}
