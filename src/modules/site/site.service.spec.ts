import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { SiteService } from './site.service';
import { Site } from './site.entity';
import { User } from '../user/user.entity';
import { UserSite } from '../user/user-site.entity';

describe('SiteService', () => {
  let service: SiteService;
  let repository: Repository<Site>;
  let userRepository: Repository<User>;
  let userSiteRepository: Repository<UserSite>;

  const mockSite = {
    id: 1,
    name: 'Test Site',
    license: 'LICENSE-123',
    url: 'https://test.com',
    domain: 'test.com',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  } as Site;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiteService,
        {
          provide: getRepositoryToken(Site),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(UserSite),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SiteService>(SiteService);
    repository = module.get<Repository<Site>>(getRepositoryToken(Site));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userSiteRepository = module.get<Repository<UserSite>>(
      getRepositoryToken(UserSite),
    );
  });

  describe('create', () => {
    it('should create a new site', async () => {
      const createDto = {
        name: 'New Site',
        license: 'LICENSE-456',
        url: 'https://new.com',
        active: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockSite);
      jest.spyOn(repository, 'save').mockResolvedValue(mockSite);

      const result = await service.create(createDto);

      expect(result).toEqual(mockSite);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { domain: 'new.com' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        domain: 'new.com',
      });
      expect(repository.save).toHaveBeenCalledWith(mockSite);
    });

    it('should throw ConflictException if domain already exists', async () => {
      const createDto = {
        name: 'New Site',
        license: 'LICENSE-456',
        url: 'https://test.com',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSite);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUserSites', () => {
    it('should return user sites', async () => {
      const userSites = [
        {
          user_id: 1,
          site_id: 1,
          site: mockSite,
        } as UserSite,
      ];
      jest.spyOn(userSiteRepository, 'find').mockResolvedValue(userSites);

      const result = await service.getUserSites(1);

      expect(result).toEqual(userSites);
      expect(userSiteRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
        relations: ['site'],
      });
    });
  });

  describe('update', () => {
    it('should update a site', async () => {
      const updateDto = { name: 'Updated Site' };
      const updatedSite = { ...mockSite, ...updateDto };

      jest.spyOn(repository, 'findOneOrFail').mockResolvedValue(mockSite);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedSite);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedSite);
      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should check for domain conflicts when updating url', async () => {
      const updateDto = { url: 'https://new-domain.com' };

      jest.spyOn(repository, 'findOneOrFail').mockResolvedValue(mockSite);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ ...mockSite, domain: 'new-domain.com' });

      await service.update(1, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { domain: 'new-domain.com' },
      });
    });

    it('should throw ConflictException if new domain already exists', async () => {
      const updateDto = { url: 'https://existing.com' };
      const existingSite = { ...mockSite, id: 2, domain: 'existing.com' };

      jest.spyOn(repository, 'findOneOrFail').mockResolvedValue(mockSite);
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingSite);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a site', async () => {
      jest.spyOn(repository, 'findOneOrFail').mockResolvedValue(mockSite);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockSite);

      await service.remove(1);

      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockSite);
    });

    it('should throw error if site not found', async () => {
      jest
        .spyOn(repository, 'findOneOrFail')
        .mockRejectedValue(new Error('Entity not found'));

      await expect(service.remove(999)).rejects.toThrow('Entity not found');
    });
  });
});
