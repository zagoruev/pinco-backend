import * as argon2 from 'argon2';
import { Repository } from 'typeorm';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { RequestUser } from '../../types/express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSite } from './user-site.entity';
import { User, UserRole } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSite)
    private userSiteRepository: Repository<UserSite>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: createUserDto.email }, { username: createUserDto.username }],
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('User with this email already exists');
      }
      throw new ConflictException('User with this username already exists');
    }

    const hashedPassword = await argon2.hash(createUserDto.password);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      active: createUserDto.active ?? true,
    });

    return await this.userRepository.save(user);
  }

  async findAll(currentUser: RequestUser, siteId: number): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.sites', 'userSite')
      .andWhere('userSite.site_id = :siteId', { siteId })
      .getMany();
  }

  async listUsers(currentUser: RequestUser, siteId?: number): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.sites', 'userSite')
      .leftJoinAndSelect('userSite.site', 'site');

    if (siteId) {
      query.andWhere('userSite.site_id = :siteId', { siteId });
    }

    return query.getMany();
  }

  async findOne(id: number, currentUser: RequestUser): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['sites', 'sites.site'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!currentUser.roles.includes(UserRole.ROOT) && currentUser.roles.includes(UserRole.ADMIN)) {
      const hasAccess = await this.checkSiteOwnerUserAccess(currentUser.id, id);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this user');
      }
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser: RequestUser): Promise<User> {
    const user = await this.findOne(id, currentUser);

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

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: number, currentUser: RequestUser): Promise<void> {
    const user = await this.findOne(id, currentUser);

    if (id === currentUser.id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    await this.userRepository.remove(user);
  }

  private async getUserSites(userId: number): Promise<number[]> {
    const userSites = await this.userSiteRepository.find({
      where: { user_id: userId },
    });
    return userSites.map((us) => us.site_id);
  }

  private async validateSiteOwnerAccess(ownerId: number, siteIds: number[]): Promise<void> {
    const ownerSites = await this.getUserSites(ownerId);
    const hasAccess = siteIds.every((siteId) => ownerSites.includes(siteId));

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to one or more of the specified sites');
    }
  }

  private async checkSiteOwnerUserAccess(ownerId: number, userId: number): Promise<boolean> {
    const ownerSites = await this.getUserSites(ownerId);
    const userSites = await this.getUserSites(userId);

    // Check if there's any overlap between owner's sites and user's sites
    return ownerSites.some((siteId) => userSites.includes(siteId));
  }
}
