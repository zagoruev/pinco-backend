import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './site.entity';
import { User } from '../user/user.entity';
import { UserSite } from '../user/user-site.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { AddUserToSiteDto } from './dto/add-user-to-site.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSite)
    private userSiteRepository: Repository<UserSite>,
  ) {}

  async create(createSiteDto: CreateSiteDto): Promise<Site> {
    // Check if domain already exists
    const existingSite = await this.siteRepository.findOne({
      where: { domain: createSiteDto.domain },
    });

    if (existingSite) {
      throw new ConflictException('Site with this domain already exists');
    }

    const site = this.siteRepository.create(createSiteDto);
    return this.siteRepository.save(site);
  }

  async findAll(): Promise<Site[]> {
    return this.siteRepository.find({
      order: { created: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Site> {
    const site = await this.siteRepository.findOne({
      where: { id },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    return site;
  }

  async update(id: number, updateSiteDto: UpdateSiteDto): Promise<Site> {
    const site = await this.findOne(id);

    // Check if domain is being changed and if it's already taken
    if (updateSiteDto.domain && updateSiteDto.domain !== site.domain) {
      const existingSite = await this.siteRepository.findOne({
        where: { domain: updateSiteDto.domain },
      });

      if (existingSite) {
        throw new ConflictException('Site with this domain already exists');
      }
    }

    Object.assign(site, updateSiteDto);
    return this.siteRepository.save(site);
  }

  async remove(id: number): Promise<void> {
    const site = await this.findOne(id);
    await this.siteRepository.remove(site);
  }

  async getUserSites(userId: number): Promise<UserSite[]> {
    return this.userSiteRepository.find({
      where: { user_id: userId },
      relations: ['site'],
    });
  }

  async getSiteUsers(siteId: number): Promise<UserSite[]> {
    const site = await this.findOne(siteId);
    
    const userSites = await this.userSiteRepository.find({
      where: { site_id: site.id },
      relations: ['user'],
      order: { created: 'DESC' },
    });

    return userSites;
  }

  async addUserToSite(siteId: number, addUserToSiteDto: AddUserToSiteDto): Promise<UserSite> {
    const site = await this.findOne(siteId);
    
    const user = await this.userRepository.findOne({
      where: { id: addUserToSiteDto.userId },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${addUserToSiteDto.userId} not found`);
    }

    // Check if user is already connected to the site
    const existingUserSite = await this.userSiteRepository.findOne({
      where: { user_id: user.id, site_id: site.id },
    });

    if (existingUserSite) {
      throw new ConflictException('User is already connected to this site');
    }

    const userSite = this.userSiteRepository.create({
      user_id: user.id,
      site_id: site.id,
      roles: addUserToSiteDto.roles,
      user,
      site,
    });

    return this.userSiteRepository.save(userSite);
  }

  async updateUserRoles(siteId: number, userId: number, updateUserRolesDto: UpdateUserRolesDto): Promise<UserSite> {
    const site = await this.findOne(siteId);
    
    const userSite = await this.userSiteRepository.findOne({
      where: { user_id: userId, site_id: site.id },
      relations: ['user', 'site'],
    });

    if (!userSite) {
      throw new NotFoundException(`User with ID ${userId} is not connected to this site`);
    }

    userSite.roles = updateUserRolesDto.roles;
    return this.userSiteRepository.save(userSite);
  }

  async removeUserFromSite(siteId: number, userId: number): Promise<void> {
    const site = await this.findOne(siteId);
    
    const userSite = await this.userSiteRepository.findOne({
      where: { user_id: userId, site_id: site.id },
    });

    if (!userSite) {
      throw new NotFoundException(`User with ID ${userId} is not connected to this site`);
    }

    await this.userSiteRepository.remove(userSite);
  }
}
