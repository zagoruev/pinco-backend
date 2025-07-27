import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User, UserRole } from './user.entity';
import { UserSite, UserSiteRole } from './user-site.entity';
import { Site } from '../site/site.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SecretService } from '../auth/secret.service';
import { RequestUser } from '../../types/express';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSite)
    private userSiteRepository: Repository<UserSite>,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    private secretService: SecretService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    currentUser: RequestUser,
  ): Promise<User> {
    // Check if email or username already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('User with this email already exists');
      }
      throw new ConflictException('User with this username already exists');
    }

    // Validate site access for SITE_OWNER
    if (
      currentUser.roles.includes(UserSiteRole.ADMIN) &&
      createUserDto.siteIds
    ) {
      await this.validateSiteOwnerAccess(
        currentUser.sub,
        createUserDto.siteIds,
      );
    }

    // Hash password
    const hashedPassword = await argon2.hash(createUserDto.password);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      active: createUserDto.active ?? true,
    });

    const savedUser = await this.userRepository.save(user);

    // Create user-site relationships
    if (createUserDto.siteIds && createUserDto.siteIds.length > 0) {
      const userSites = createUserDto.siteIds.map((siteId) =>
        this.userSiteRepository.create({
          user_id: savedUser.id,
          site_id: siteId,
          // roles: createUserDto.roles,
        }),
      );
      await this.userSiteRepository.save(userSites);
    }

    // Generate invite token if requested
    if (createUserDto.invite) {
      const secretToken = await this.secretService.generateSecretToken(
        savedUser.id,
        savedUser.id,
      );
      savedUser.secret_token = secretToken;

      // Emit event for email notification
      this.eventEmitter.emit('user.invited', {
        user: savedUser,
        secretToken,
      });
    }

    return savedUser;
  }

  async findAll(currentUser: RequestUser, siteId?: number): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userSites', 'userSite')
      .leftJoinAndSelect('userSite.site', 'site');

    // If SITE_OWNER, only show users from their sites
    if (
      currentUser.roles.includes(UserSiteRole.ADMIN) &&
      !currentUser.roles.includes(UserRole.ADMIN)
    ) {
      const ownerSites = await this.getUserSites(currentUser.sub);
      query.where('userSite.site_id IN (:...siteIds)', { siteIds: ownerSites });
    }

    // Filter by specific site if provided
    if (siteId) {
      query.andWhere('userSite.site_id = :siteId', { siteId });
    }

    return query.getMany();
  }

  async findOne(id: number, currentUser: RequestUser): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userSites', 'userSites.site'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check access for SITE_OWNER
    if (
      currentUser.roles.includes(UserSiteRole.ADMIN) &&
      !currentUser.roles.includes(UserRole.ADMIN)
    ) {
      const hasAccess = await this.checkSiteOwnerUserAccess(
        currentUser.sub,
        id,
      );
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this user');
      }
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser: RequestUser,
  ): Promise<User> {
    const user = await this.findOne(id, currentUser);

    // Check for email/username conflicts
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser) {
        throw new ConflictException('User with this username already exists');
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }

    // Update user
    Object.assign(user, updateUserDto);
    const savedUser = await this.userRepository.save(user);

    // Update user-site relationships if provided
    if (updateUserDto.siteIds !== undefined) {
      // Validate site access for SITE_OWNER
      if (
        currentUser.roles.includes(UserSiteRole.ADMIN) &&
        !currentUser.roles.includes(UserRole.ADMIN)
      ) {
        await this.validateSiteOwnerAccess(
          currentUser.sub,
          updateUserDto.siteIds,
        );
      }

      // Remove existing relationships
      await this.userSiteRepository.delete({ user_id: id });

      // Create new relationships
      if (updateUserDto.siteIds.length > 0) {
        const userSites = updateUserDto.siteIds.map((siteId) =>
          this.userSiteRepository.create({
            user_id: id,
            site_id: siteId,
            // roles: updateUserDto.roles || user.roles,
          }),
        );
        await this.userSiteRepository.save(userSites);
      }
    }

    return savedUser;
  }

  async remove(id: number, currentUser: RequestUser): Promise<void> {
    const user = await this.findOne(id, currentUser);

    // Prevent self-deletion
    if (id === currentUser.sub) {
      throw new BadRequestException('You cannot delete your own account');
    }

    await this.userRepository.remove(user);
  }

  async invite(
    id: number,
    currentUser: RequestUser,
  ): Promise<{ secretToken: string }> {
    const user = await this.findOne(id, currentUser);

    const secretToken = await this.secretService.generateSecretToken(id, id);

    // Get the first site the user is associated with for the invite
    const userSites = await this.userSiteRepository.find({
      where: { user_id: id },
      relations: ['site'],
    });

    if (userSites.length > 0) {
      // Emit event for email notification
      this.eventEmitter.emit('user.invited', {
        user,
        site: userSites[0].site,
        secretToken,
      });
    }

    return { secretToken };
  }

  async revokeInvite(id: number, currentUser: RequestUser): Promise<void> {
    await this.findOne(id, currentUser); // Check access
    await this.secretService.revokeSecretToken(id);
  }

  private async getUserSites(userId: number): Promise<number[]> {
    const userSites = await this.userSiteRepository.find({
      where: { user_id: userId },
    });
    return userSites.map((us) => us.site_id);
  }

  private async validateSiteOwnerAccess(
    ownerId: number,
    siteIds: number[],
  ): Promise<void> {
    const ownerSites = await this.getUserSites(ownerId);
    const hasAccess = siteIds.every((siteId) => ownerSites.includes(siteId));

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to one or more of the specified sites',
      );
    }
  }

  private async checkSiteOwnerUserAccess(
    ownerId: number,
    userId: number,
  ): Promise<boolean> {
    const ownerSites = await this.getUserSites(ownerId);
    const userSites = await this.getUserSites(userId);

    // Check if there's any overlap between owner's sites and user's sites
    return ownerSites.some((siteId) => userSites.includes(siteId));
  }
}
