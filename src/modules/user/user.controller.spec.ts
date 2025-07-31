import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserSiteService } from './user-site.service';
import { User, UserRole } from './user.entity';
import { Site } from '../site/site.entity';
import { UserSite, UserSiteRole } from './user-site.entity';
import { RequestUser } from '../../types/express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { ResendInviteDto } from './dto/resend-invite.dto';
import { RevokeInviteDto } from './dto/revoke-invite.dto';
import { DeleteInviteDto } from './dto/delete-invite.dto';
import { UpdateUserSiteRolesDto } from './dto/update-user-site-roles.dto';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OriginGuard } from '../../common/guards/origin.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let userSiteService: UserSiteService;

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    username: 'testuser',
    password: 'hashed',
    active: true,
    roles: [UserRole.ADMIN],
    created: new Date(),
    updated: new Date(),
    sites: [],
    comments: [],
    replies: [],
    commentViews: [],
    get color() {
      return '#4C53F1';
    },
  } as User;

  const mockSite = {
    id: 1,
    name: 'Test Site',
    url: 'https://test.com',
    domain: 'test.com',
    license: 'ABC123',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  } as Site;

  const mockUserSite = {
    user_id: 1,
    site_id: 1,
    roles: [UserSiteRole.ADMIN],
    invite_code: null,
    created: new Date(),
    updated: new Date(),
    user: mockUser,
    site: mockSite,
  } as UserSite;

  const mockRequestUser: RequestUser = {
    id: 1,
    email: 'admin@example.com',
    roles: ['ADMIN'],
    sites: [mockUserSite],
  };

  const mockUserService = {
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    remove: jest.fn().mockResolvedValue(undefined),
    listUsers: jest.fn().mockResolvedValue([mockUser]),
  };

  const mockUserSiteService = {
    addUserToSite: jest.fn().mockResolvedValue(mockUserSite),
    updateUserSiteRoles: jest.fn().mockResolvedValue(mockUserSite),
    inviteUser: jest.fn().mockResolvedValue(mockUserSite),
    revokeInvite: jest.fn().mockResolvedValue(undefined),
    removeUserFromSite: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: UserSiteService,
          useValue: mockUserSiteService,
        },
      ],
    })
      .overrideGuard(CookieAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OriginGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    userSiteService = module.get<UserSiteService>(UserSiteService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const result = await controller.getCurrentUser(mockRequestUser);

      expect(userService.findOne).toHaveBeenCalledWith(
        mockRequestUser.id,
        mockRequestUser,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all site users', async () => {
      const result = await controller.findAll(mockSite, mockRequestUser);

      expect(userService.findAll).toHaveBeenCalledWith(
        mockRequestUser,
        mockSite.id,
      );
      expect(result).toEqual([mockUser]);
    });
  });

  describe('listAll', () => {
    it('should list all users', async () => {
      const result = await controller.listAll(mockRequestUser, 1);

      expect(userService.listUsers).toHaveBeenCalledWith(mockRequestUser, 1);
      expect(result).toEqual([mockUser]);
    });

    it('should list all users without siteId', async () => {
      const result = await controller.listAll(mockRequestUser);

      expect(userService.listUsers).toHaveBeenCalledWith(
        mockRequestUser,
        undefined,
      );
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const result = await controller.findOne(1, mockRequestUser);

      expect(userService.findOne).toHaveBeenCalledWith(1, mockRequestUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto: CreateUserDto = {
        email: 'new@example.com',
        name: 'New User',
        username: 'newuser',
        password: 'password123',
        roles: [UserRole.ADMIN],
      };

      const result = await controller.create(createDto, mockRequestUser);

      expect(userService.create).toHaveBeenCalledWith(
        createDto,
        mockRequestUser,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const result = await controller.update(1, updateDto, mockRequestUser);

      expect(userService.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockRequestUser,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const result = await controller.remove(1, mockRequestUser);

      expect(userService.remove).toHaveBeenCalledWith(1, mockRequestUser);
      expect(result).toBeUndefined();
    });
  });

  describe('invite', () => {
    it('should send invite to user', async () => {
      const inviteDto: InviteUserDto = {
        user_id: 1,
        site_id: 1,
        roles: [UserSiteRole.COLLABORATOR],
        invite: true,
      };

      const result = await controller.invite(inviteDto);

      expect(userSiteService.addUserToSite).toHaveBeenCalledWith(
        inviteDto.user_id,
        inviteDto.site_id,
        inviteDto.roles,
        inviteDto.invite,
      );
      expect(result).toEqual(mockUserSite);
    });
  });

  describe('updateInvite', () => {
    it('should update user invite', async () => {
      const updateDto: UpdateUserSiteRolesDto = {
        user_id: 1,
        site_id: 1,
        roles: [UserSiteRole.COLLABORATOR],
      };

      const result = await controller.updateInvite(updateDto);

      expect(userSiteService.updateUserSiteRoles).toHaveBeenCalledWith(
        updateDto.user_id,
        updateDto.site_id,
        updateDto.roles,
      );
      expect(result).toEqual(mockUserSite);
    });
  });

  describe('deleteInvite', () => {
    it('should delete user invite', async () => {
      const deleteDto: DeleteInviteDto = {
        user_id: 1,
        site_id: 1,
      };

      const result = await controller.deleteInvite(deleteDto);

      expect(userSiteService.removeUserFromSite).toHaveBeenCalledWith(
        deleteDto.user_id,
        deleteDto.site_id,
      );
      expect(result).toBeUndefined();
    });
  });

  describe('resendInvite', () => {
    it('should resend invite to user', async () => {
      const resendDto: ResendInviteDto = {
        user_id: 1,
        site_id: 1,
      };

      const result = await controller.resendInvite(resendDto);

      expect(userSiteService.inviteUser).toHaveBeenCalledWith(
        resendDto.user_id,
        resendDto.site_id,
      );
      expect(result).toEqual(mockUserSite);
    });
  });

  describe('revokeInvite', () => {
    it('should revoke user invite', async () => {
      const revokeDto: RevokeInviteDto = {
        user_id: 1,
        site_id: 1,
      };

      const result = await controller.revokeInvite(revokeDto);

      expect(userSiteService.revokeInvite).toHaveBeenCalledWith(
        revokeDto.user_id,
        revokeDto.site_id,
      );
      expect(result).toBeUndefined();
    });
  });
});
