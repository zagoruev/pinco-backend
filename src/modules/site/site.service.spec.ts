import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SiteService } from './site.service';
import { Site } from './site.entity';

describe('SiteService', () => {
  let service: SiteService;
  let repository: Repository<Site>;

  const mockSite: Site = {
    id: 1,
    name: 'Test Site',
    license: 'LICENSE-123',
    domain: 'test.com',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  };

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
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SiteService>(SiteService);
    repository = module.get<Repository<Site>>(getRepositoryToken(Site));
  });

  describe('create', () => {
    it('should create a new site', async () => {
      const createDto = {
        name: 'New Site',
        license: 'LICENSE-456',
        domain: 'new.com',
        active: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockSite);
      jest.spyOn(repository, 'save').mockResolvedValue(mockSite);

      const result = await service.create(createDto);

      expect(result).toEqual(mockSite);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { domain: createDto.domain },
      });
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockSite);
    });

    it('should throw ConflictException if domain already exists', async () => {
      const createDto = {
        name: 'New Site',
        license: 'LICENSE-456',
        domain: 'test.com',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSite);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all sites', async () => {
      const sites = [mockSite];
      jest.spyOn(repository, 'find').mockResolvedValue(sites);

      const result = await service.findAll();

      expect(result).toEqual(sites);
      expect(repository.find).toHaveBeenCalledWith({
        order: { created: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a site by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSite);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSite);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if site not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a site', async () => {
      const updateDto = { name: 'Updated Site' };
      const updatedSite = { ...mockSite, ...updateDto };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockSite);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedSite);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedSite);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should check for domain conflicts when updating domain', async () => {
      const updateDto = { domain: 'new-domain.com' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockSite);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ ...mockSite, ...updateDto });

      await service.update(1, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { domain: updateDto.domain },
      });
    });

    it('should throw ConflictException if new domain already exists', async () => {
      const updateDto = { domain: 'existing.com' };
      const existingSite = { ...mockSite, id: 2, domain: 'existing.com' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockSite);
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingSite);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a site', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSite);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockSite);

      await service.remove(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(mockSite);
    });

    it('should throw NotFoundException if site not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
