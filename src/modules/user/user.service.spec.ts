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
import { SecretService } from '../auth/secret.service';
import { TokenPayload } from '../auth/token.service';

jest.mock('argon2');

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let userSiteRepository: Repository<UserSite>;
  let siteRepository: Repository<Site>;
  let secretService: SecretService;
  let eventEmitter: EventEmitter2;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    color: '#FF0000',
    username: 'testuser',
    password: 'hashed-password',
    active: true,
    roles: [UserRole.COMMENTER],
    secret_token: null,
    secret_expires: null,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
    replies: [],
    commentViews: [],
  };

  const mockAdminPayload: TokenPayload = {
    sub: 1,
    email: 'admin@example.com',
    roles: [UserRole.ADMIN],
  };

  const mockSiteOwnerPayload: TokenPayload = {
    sub: 2,
    email: 'owner@example.com',
    roles: [UserRole.SITE_OWNER],
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
          provide: getRepositoryToken(Site),
          useValue: {},
        },
        {
          provide: SecretService,
          useValue: {
            generateSecretToken: jest.fn(),
            revokeSecretToken: jest.fn(),
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
    siteRepository = module.get<Repository<Site>>(getRepositoryToken(Site));
    secretService = module.get<SecretService>(SecretService);
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
      roles: [UserRole.COMMENTER],
      siteIds: [1],
    };

    it('should create a new user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      jest.spyOn(userSiteRepository, 'create').mockReturnValue({} as UserSite);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.create(createDto, mockAdminPayload);

      expect(result).toEqual(mockUser);
      expect(argon2.hash).toHaveBeenCalledWith(createDto.password);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.create(createDto, mockAdminPayload)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should emit event if invite is requested', async () => {
      const createDtoWithInvite = { ...createDto, invite: true };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      jest
        .spyOn(secretService, 'generateSecretToken')
        .mockResolvedValue('secret-token');
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');

      await service.create(createDtoWithInvite, mockAdminPayload);

      expect(secretService.generateSecretToken).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.invited', {
        user: expect.objectContaining({ id: mockUser.id }),
        secretToken: 'secret-token',
      });
    });
  });

  describe('findAll', () => {
    it('should return all users for admin', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };
      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.findAll(mockAdminPayload);

      expect(result).toEqual([mockUser]);
      expect(queryBuilder.where).not.toHaveBeenCalled();
    });

    it('should filter users by site for site owner', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };
      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest
        .spyOn(userSiteRepository, 'find')
        .mockResolvedValue([{ user_id: 2, site_id: 1 } as UserSite]);

      const result = await service.findAll(mockSiteOwnerPayload);

      expect(result).toEqual([mockUser]);
      expect(queryBuilder.where).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findOne(1, mockAdminPayload);

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999, mockAdminPayload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for site owner without access', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest
        .spyOn(userSiteRepository, 'find')
        .mockResolvedValueOnce([{ user_id: 2, site_id: 1 } as UserSite])
        .mockResolvedValueOnce([{ user_id: 1, site_id: 2 } as UserSite]);

      await expect(service.findOne(1, mockSiteOwnerPayload)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto = { name: 'Updated User' };
      const updatedUser = { ...mockUser, ...updateDto };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto, mockAdminPayload);

      expect(result).toEqual(updatedUser);
    });

    it('should hash password if provided', async () => {
      const updateDto = { password: 'newpassword' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await service.update(1, updateDto, mockAdminPayload);

      expect(argon2.hash).toHaveBeenCalledWith('newpassword');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const differentAdminPayload = { ...mockAdminPayload, sub: 2 };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'remove').mockResolvedValue(mockUser);

      await service.remove(1, differentAdminPayload);

      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should prevent self-deletion', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      await expect(service.remove(1, mockAdminPayload)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('invite', () => {
    it('should generate invite token and emit event', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest
        .spyOn(secretService, 'generateSecretToken')
        .mockResolvedValue('secret-token');

      const result = await service.invite(1, mockAdminPayload);

      expect(result).toEqual({ secretToken: 'secret-token' });
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.invited', {
        user: mockUser,
        secretToken: 'secret-token',
      });
    });
  });

  describe('revokeInvite', () => {
    it('should revoke invite token', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(secretService, 'revokeSecretToken').mockResolvedValue();

      await service.revokeInvite(1, mockAdminPayload);

      expect(secretService.revokeSecretToken).toHaveBeenCalledWith(1);
    });
  });
});
