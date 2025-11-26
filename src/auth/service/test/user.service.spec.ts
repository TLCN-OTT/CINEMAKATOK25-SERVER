import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { GENDER, USER_STATUS } from '@app/common/enums/global.enum';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditLogService } from '../../../audit-log/service/audit-log.service';
import { BanUserDto, CreateUserDto, UpdateUserDto, UpdateUserInfoDto } from '../../dtos/user.dto';
import { EntityUser } from '../../entities/user.entity';
import { EmailService } from '../email.service';
import { UserService } from '../user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<EntityUser>;
  let auditLogService: AuditLogService;
  let emailService: EmailService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    isAdmin: false,
    isEmailVerified: true,
    provider: null,
    providerId: null,
    avatar: null,
    address: null,
    phoneNumber: null,
    status: USER_STATUS.ACTIVATED,
    banReason: null,
    bannedUntil: null,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    dateOfBirth: new Date('1990-01-01'),
    gender: GENDER.MALE,
    reviews: [],
    reviewEpisodes: [],
    watchlist: [],
    favorites: [],
    watchProgress: [],
    hasId: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  } as unknown as EntityUser;

  const mockCreateUserDto: CreateUserDto = {
    email: 'newuser@example.com',
    name: 'New User',
    isAdmin: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(EntityUser),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
            existsBy: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orWhere: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn(),
              getMany: jest.fn(),
              execute: jest.fn(),
            })),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendUserBanNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<EntityUser>>(getRepositoryToken(EntityUser));
    auditLogService = module.get<AuditLogService>(AuditLogService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const mockQuery = { page: 1, limit: 10 };
    const mockUsers = [mockUser];
    const mockTotal = 1;

    it('should return paginated users without search', async () => {
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, mockTotal]),
      };
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual({ data: mockUsers, total: mockTotal });
    });

    it('should return paginated users with search', async () => {
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, mockTotal]),
      };
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);

      const result = await service.findAll(mockQuery, 'test');

      expect(result).toEqual({ data: mockUsers, total: mockTotal });
    });

    it('should handle custom sorting', async () => {
      const queryWithSort = { ...mockQuery, sort: '{"name": "ASC", "email": "DESC"}' };
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, mockTotal]),
      };
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);

      const result = await service.findAll(queryWithSort);

      expect(result).toEqual({ data: mockUsers, total: mockTotal });
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email!);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email!.toLowerCase() },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findByEmail('nonexistent@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      jest.spyOn(userRepository, 'existsBy').mockResolvedValue(false);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      const result = await service.create(mockCreateUserDto);

      expect(result).toEqual(mockUser);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockCreateUserDto,
        email: mockCreateUserDto.email.toLowerCase(),
        password: expect.any(String),
      });
    });

    it('should throw BadRequestException if email already exists', async () => {
      jest.spyOn(userRepository, 'existsBy').mockResolvedValue(true);

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
      isAdmin: false,
      status: USER_STATUS.ACTIVATED,
    };

    it('should update user successfully', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({ ...mockUser } as EntityUser);
      jest.spyOn(userRepository, 'existsBy').mockResolvedValue(false);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue({ ...mockUser, ...updateUserDto } as EntityUser);

      const result = await service.update(mockUser.id, updateUserDto);

      expect(result).toEqual({ ...mockUser, ...updateUserDto });
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UPDATE_USER,
        userId: mockUser.id,
        description: `User ${updateUserDto.email} updated their profile`,
      });
    });

    it('should throw BadRequestException if new email already exists', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({ ...mockUser } as EntityUser);
      (userRepository.existsBy as jest.MockedFunction<any>).mockImplementationOnce(() =>
        Promise.resolve(true),
      );

      await expect(service.update(mockUser.id, updateUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'remove').mockResolvedValue(mockUser);

      await service.delete(mockUser.id);

      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.DELETE_USER,
        userId: mockUser.id,
        description: `User ${mockUser.email} was deleted`,
      });
    });
  });

  describe('banUser', () => {
    const banUserDto: BanUserDto = {
      banReason: 'Violation of terms',
      durationDays: 7,
    };

    it('should ban user successfully', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue({
        ...mockUser,
        isBanned: true,
        banReason: banUserDto.banReason,
      } as EntityUser);
      jest.spyOn(emailService, 'sendUserBanNotification').mockResolvedValue(undefined);

      const result = await service.banUser(mockUser.id, banUserDto);

      expect(result.isBanned).toBe(true);
      expect(result.banReason).toBe(banUserDto.banReason);
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.USER_BAN,
        userId: mockUser.id,
        description: expect.stringContaining('was banned'),
      });
      expect(emailService.sendUserBanNotification).toHaveBeenCalled();
    });

    it('should ban user even if email sending fails', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue({ ...mockUser, isBanned: true } as EntityUser);
      jest
        .spyOn(emailService, 'sendUserBanNotification')
        .mockRejectedValue(new Error('Email failed'));

      const result = await service.banUser(mockUser.id, banUserDto);

      expect(result.isBanned).toBe(true);
    });
  });

  describe('unbanUser', () => {
    it('should unban user successfully', async () => {
      const bannedUser = {
        ...mockUser,
        isBanned: true,
        banReason: 'Test ban',
        bannedUntil: new Date(),
      } as EntityUser;
      jest.spyOn(service, 'findById').mockResolvedValue(bannedUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue({
        ...bannedUser,
        isBanned: false,
        banReason: null,
        bannedUntil: null,
      } as unknown as EntityUser);

      const result = await service.unbanUser(mockUser.id);

      expect(result.isBanned).toBe(false);
      expect(result.banReason).toBe(null);
      expect(result.bannedUntil).toBe(null);
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.USER_UNBAN,
        userId: mockUser.id,
        description: `User ${mockUser.email} was unbanned`,
      });
    });
  });

  describe('getUserDetail', () => {
    it('should return user detail', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);

      const result = await service.getUserDetail(mockUser.id);

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUserInfo', () => {
    const updateUserInfoDto: UpdateUserInfoDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
      isAdmin: false,
    };

    it('should update user info successfully', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({ ...mockUser } as EntityUser);
      jest.spyOn(userRepository, 'existsBy').mockResolvedValue(false);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue({ ...mockUser, ...updateUserInfoDto } as EntityUser);

      const result = await service.updateUserInfo(mockUser.id, updateUserInfoDto);

      expect(result).toEqual({ ...mockUser, ...updateUserInfoDto });
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UPDATE_USER,
        userId: mockUser.id,
        description: `Admin updated user ${updateUserInfoDto.email} info`,
      });
    });

    it('should throw BadRequestException if email already exists', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({ ...mockUser } as EntityUser);
      (userRepository.existsBy as jest.MockedFunction<any>).mockImplementationOnce(() =>
        Promise.resolve(true),
      );

      await expect(service.updateUserInfo(mockUser.id, updateUserInfoDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('unbanExpiredUsers', () => {
    it('should unban expired users successfully', async () => {
      const expiredBannedUsers = [
        { ...mockUser, id: 'user-1', isBanned: true, bannedUntil: new Date(Date.now() - 1000) },
        { ...mockUser, id: 'user-2', isBanned: true, bannedUntil: new Date(Date.now() - 2000) },
      ];

      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(expiredBannedUsers),
      };
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      const result = await service.unbanExpiredUsers();

      expect(result).toBe(2);
      expect(userRepository.save).toHaveBeenCalledTimes(2);
      expect(auditLogService.log).toHaveBeenCalledTimes(2);
    });

    it('should return 0 if no expired bans', async () => {
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);

      const result = await service.unbanExpiredUsers();

      expect(result).toBe(0);
    });
  });
});
