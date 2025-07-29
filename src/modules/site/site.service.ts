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
    const url = new URL(createSiteDto.url);
    const domain = url.hostname;

    // Check if domain already exists
    const existingSite = await this.siteRepository.findOne({
      where: { domain },
    });

    if (existingSite) {
      throw new ConflictException('Site with this domain already exists');
    }

    const site = this.siteRepository.create({
      ...createSiteDto,
      domain,
    });

    return this.siteRepository.save(site);
  }

  async list(): Promise<Site[]> {
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
    if (updateSiteDto.url) {
      const url = new URL(updateSiteDto.url);
      const domain = url.hostname;

      if (domain !== site.domain) {
        const existingSite = await this.siteRepository.findOne({
          where: { domain },
        });

        if (existingSite) {
          throw new ConflictException('Site with this domain already exists');
        }
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
}
