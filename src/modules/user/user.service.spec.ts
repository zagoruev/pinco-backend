import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserService } from './user.service';
import { User, UserRole } from './user.entity';
import { UserSite } from './user-site.entity';
import { Site } from '../site/site.entity';
import { UserSiteService } from './user-site.service';
import { UserSiteRole } from './user-site.entity';
import { RequestUser } from '../../types/express';

jest.mock('argon2');

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let userSiteRepository: Repository<UserSite>;
  let siteRepository: Repository<Site>;
  let userSiteService: UserSiteService;
  let eventEmitter: EventEmitter2;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    get color() {
      return '#4C53F1';
    },
    username: 'testuser',
    password: 'hashed-password',
    active: true,
    roles: [UserRole.ADMIN],
    created: new Date(),
    updated: new Date(),
    sites: [],
    userSites: [],
    comments: [],
    replies: [],
    commentViews: [],
  } as User;

  const mockAdminUser: RequestUser = {
    id: 1,
    email: 'admin@example.com',
    roles: [UserRole.ADMIN],
    sites: [],
  };

  const mockSiteOwnerUser: RequestUser = {
    id: 2,
    email: 'owner@example.com',
    roles: ['ADMIN'], // Has ADMIN role but not global UserRole.ADMIN
    sites: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSite),
          useValue: {
            create: jest.fn(),
            save: jest
              .fn()
              .mockImplementation((entities) =>
                Promise.resolve(
                  Array.isArray(entities) ? entities : [entities],
                ),
              ),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: UserSiteService,
          useValue: {
            generateInviteToken: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userSiteRepository = module.get<Repository<UserSite>>(
      getRepositoryToken(UserSite),
    );
    userSiteService = module.get<UserSiteService>(UserSiteService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      email: 'new@example.com',
      name: 'New User',
      color: '#00FF00',
      username: 'newuser',
      password: 'password123',
      roles: [UserRole.ADMIN],
      siteIds: [1],
    };

    it('should create a new user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      jest
        .spyOn(userSiteRepository, 'create')
        .mockImplementation((data) => data as UserSite);
      jest
        .spyOn(userSiteRepository, 'find')
        .mockResolvedValue([{ user_id: 1, site_id: 1 } as UserSite]);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.create(createDto, mockAdminUser);

      expect(result).toEqual(mockUser);
      expect(argon2.hash).toHaveBeenCalledWith(createDto.password);
      expect(userRepository.save).toHaveBeenCalled();
      expect(userSiteRepository.save).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: mockUser.id,
          site_id: 1,
        }),
      ]);
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.create(createDto, mockAdminUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      const userWithSameUsername = {
        ...mockUser,
        email: 'different@example.com',
        get color() {
          return '#4C53F1';
        },
      } as User;
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(userWithSameUsername);

      await expect(service.create(createDto, mockAdminUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException with specific message for email conflict', async () => {
      const existingUser = {
        ...mockUser,
        email: createDto.email,
        username: 'differentusername',
      } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser);

      await expect(service.create(createDto, mockAdminUser)).rejects.toThrow(
        'User with this email already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return all users for a site', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };
      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.findAll(mockAdminUser, 1);

      expect(result).toEqual([mockUser]);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'userSite.site_id = :siteId',
        { siteId: 1 },
      );
    });
  });

  describe('listUsers', () => {
    it('should return all users with site relationships', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };
      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.listUsers(mockAdminUser);

      expect(result).toEqual([mockUser]);
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'user.sites',
        'userSite',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'userSite.site',
        'site',
      );
    });

    it('should filter by site when siteId is provided', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };
      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.listUsers(mockAdminUser, 1);

      expect(result).toEqual([mockUser]);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'userSite.site_id = :siteId',
        { siteId: 1 },
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findOne(1, mockAdminUser);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['sites', 'sites.site'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999, mockAdminUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it.skip('should throw ForbiddenException for site owner without access', async () => {
      const regularUser = {
        ...mockUser,
        id: 3,
        roles: [],
        get color() {
          return '#4C53F1';
        },
      } as User;

      jest.clearAllMocks();
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(regularUser);
      jest
        .spyOn(userSiteRepository, 'find')
        .mockImplementation((options: any) => {
          if (options.where.user_id === 2) {
            return Promise.resolve([{ user_id: 2, site_id: 1 } as UserSite]);
          } else if (options.where.user_id === 3) {
            return Promise.resolve([{ user_id: 3, site_id: 2 } as UserSite]);
          }
          return Promise.resolve([]);
        });

      await expect(service.findOne(3, mockSiteOwnerUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it.skip('should check site owner access when user has ADMIN site role but not global ADMIN', async () => {
      const siteAdminUser: RequestUser = {
        id: 4,
        email: 'siteadmin@example.com',
        roles: ['ADMIN'], // Has ADMIN in roles (which is checked as site admin when not global admin)
        sites: [{ user_id: 4, site_id: 1 } as UserSite],
      };

      const targetUser = {
        ...mockUser,
        id: 5,
        roles: [],
        get color() {
          return '#4C53F1';
        },
      } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(targetUser);

      // Mock checkSiteOwnerUserAccess to return false (no access)
      jest
        .spyOn(service as any, 'checkSiteOwnerUserAccess')
        .mockResolvedValue(false);

      await expect(service.findOne(5, siteAdminUser)).rejects.toThrow(
        'You do not have access to this user',
      );
    });

    it('should allow site admin access when users share a site', async () => {
      const siteAdminUser: RequestUser = {
        id: 4,
        email: 'siteadmin@example.com',
        roles: ['ADMIN'], // Has ADMIN in roles (which is checked as site admin when not global admin)
        sites: [{ user_id: 4, site_id: 1 } as UserSite],
      };

      const targetUser = {
        ...mockUser,
        id: 5,
        roles: [],
        get color() {
          return '#4C53F1';
        },
      } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(targetUser);

      // Mock checkSiteOwnerUserAccess to return true (has access)
      jest
        .spyOn(service as any, 'checkSiteOwnerUserAccess')
        .mockResolvedValue(true);

      const result = await service.findOne(5, siteAdminUser);
      expect(result).toEqual(targetUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto = { name: 'Updated User' };
      const updatedUser = {
        ...mockUser,
        ...updateDto,
        get color() {
          return '#4C53F1';
        },
      } as User;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto, mockAdminUser);

      expect(result).toEqual(updatedUser);
    });

    it('should hash password if provided', async () => {
      const updateDto = { password: 'newpassword' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await service.update(1, updateDto, mockAdminUser);

      expect(argon2.hash).toHaveBeenCalledWith('newpassword');
    });

    it('should throw ConflictException if new email already exists', async () => {
      const updateDto = { email: 'existing@example.com' };
      const existingUser = {
        ...mockUser,
        id: 2,
        get color() {
          return '#4C53F1';
        },
      } as User;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser);

      await expect(service.update(1, updateDto, mockAdminUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update user-site relationships if siteIds provided', async () => {
      const updateDto = { siteIds: [2, 3] };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      jest.spyOn(userSiteRepository, 'delete').mockResolvedValue({} as any);
      jest
        .spyOn(userSiteRepository, 'create')
        .mockImplementation((data) => data as UserSite);

      await service.update(1, updateDto, mockAdminUser);

      expect(userSiteRepository.delete).toHaveBeenCalledWith({ user_id: 1 });
      expect(userSiteRepository.save).toHaveBeenCalledWith([
        expect.objectContaining({ user_id: 1, site_id: 2 }),
        expect.objectContaining({ user_id: 1, site_id: 3 }),
      ]);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const differentAdminUser = { ...mockAdminUser, id: 2 };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'remove').mockResolvedValue(mockUser);

      await service.remove(1, differentAdminUser);

      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should prevent self-deletion', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      await expect(service.remove(1, mockAdminUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('invite', () => {
    it('should generate invite token and emit event', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest
        .spyOn(userSiteService, 'generateInviteToken')
        .mockResolvedValue('secret-token');
      jest
        .spyOn(userSiteRepository, 'find')
        .mockResolvedValue([
          { user_id: 1, site_id: 1, site: { name: 'Test Site' } } as UserSite,
        ]);

      const result = await service.invite(1, mockAdminUser);

      expect(result).toEqual({ secretToken: 'secret-token' });
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.invited', {
        user: mockUser,
        site: { name: 'Test Site' },
        secretToken: 'secret-token',
      });
    });
  });

  describe('revokeInvite', () => {
    it('should check access before revoking', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      await service.revokeInvite(1, mockAdminUser);

      expect(service.findOne).toHaveBeenCalledWith(1, mockAdminUser);
    });
  });
});
