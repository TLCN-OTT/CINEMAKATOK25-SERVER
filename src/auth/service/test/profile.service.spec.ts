import * as fs from 'fs';
import * as path from 'path';

import { Repository, UpdateResult } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { GENDER, USER_STATUS } from '@app/common/enums/global.enum';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { PasswordHash } from '@app/common/utils/hash';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditLogService } from '../../../audit-log/service/audit-log.service';
import { ChangePasswordRequest, UpdateProfileRequest } from '../../dtos/profile.dto';
import { EntityUser } from '../../entities/user.entity';
import { ProfileService } from '../profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let userRepository: Repository<EntityUser>;
  let auditLogService: AuditLogService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1990-01-01'),
    address: '123 Test St',
    phoneNumber: '+1234567890',
    avatar: null,
    isBanned: false,
    isAdmin: false,
    isEmailVerified: true,
    provider: null as any,
    providerId: null as any,
    status: USER_STATUS.ACTIVATED,
    banReason: null,
    bannedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(EntityUser),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    userRepository = module.get<Repository<EntityUser>>(getRepositoryToken(EntityUser));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto: UpdateProfileRequest = {
      name: 'Updated Name',
      gender: GENDER.FEMALE,
      dateOfBirth: new Date('1995-05-15'),
      address: '456 Updated St',
      phoneNumber: '+0987654321',
    };

    it('should update profile successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, ...updateProfileDto };
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser as EntityUser);

      const result = await service.updateProfile(mockUser.id, updateProfileDto);

      expect(result.name).toBe(updateProfileDto.name);
      expect(result.gender).toBe(updateProfileDto.gender);
      expect(result.address).toBe(updateProfileDto.address);
      expect(result.phoneNumber).toBe(updateProfileDto.phoneNumber);
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UPDATE_USER,
        userId: mockUser.id,
        description: `User ${mockUser.email} updated their profile`,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateProfile('nonexistent', updateProfileDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid date of birth', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const invalidDto = { ...updateProfileDto, dateOfBirth: 'invalid-date' as any };

      await expect(service.updateProfile(mockUser.id, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid phone number', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const invalidDto = { ...updateProfileDto, phoneNumber: 'invalid-phone' };

      await expect(service.updateProfile(mockUser.id, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'New Name' } as UpdateProfileRequest;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue({ ...mockUser, ...partialUpdate } as EntityUser);

      const result = await service.updateProfile(mockUser.id, partialUpdate);

      expect(result.name).toBe('New Name');
      expect(result.gender).toBe(mockUser.gender); // Should remain unchanged
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordRequest = {
      currentPassword: 'currentPass',
      newPassword: 'newPass123',
      confirmPassword: 'newPass123',
    };

    it('should change password successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(PasswordHash, 'comparePassword').mockReturnValue(true);
      jest.spyOn(PasswordHash, 'hashPassword').mockReturnValue('newHashedPassword');
      jest.spyOn(userRepository, 'update').mockResolvedValue({ affected: 1 } as UpdateResult);

      await service.changePassword(mockUser.id, changePasswordDto);

      expect(PasswordHash.comparePassword).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.password,
      );
      expect(PasswordHash.hashPassword).toHaveBeenCalledWith(changePasswordDto.newPassword);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        password: 'newHashedPassword',
      });
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.CHANGE_PASSWORD,
        userId: mockUser.id,
        description: `User ${mockUser.email} changed their password`,
      });
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      const invalidDto = { ...changePasswordDto, confirmPassword: 'differentPassword' };

      await expect(service.changePassword(mockUser.id, invalidDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.CHANGE_PASSWORD,
        userId: mockUser.id,
        description: `User with ID ${mockUser.id} provided non-matching new password and confirmation`,
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.changePassword('nonexistent', changePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user has no password', async () => {
      const userWithoutPassword = { ...mockUser, password: null } as unknown as EntityUser;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithoutPassword);

      await expect(service.changePassword(mockUser.id, changePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(PasswordHash, 'comparePassword').mockReturnValue(false);

      await expect(service.changePassword(mockUser.id, changePasswordDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.CHANGE_PASSWORD,
        userId: mockUser.id,
        description: `User ${mockUser.email} provided incorrect current password`,
      });
    });
  });

  describe('uploadAvatar', () => {
    const mockFile = {
      originalname: 'avatar.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 500, // 500KB
      buffer: Buffer.from('fake-image-data'),
    } as any;

    beforeEach(() => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      jest.spyOn(fs, 'mkdirSync').mockImplementation();
      jest.spyOn(fs, 'writeFileSync').mockImplementation();
      jest.spyOn(fs, 'unlinkSync').mockImplementation();
    });

    it('should upload avatar successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'update').mockResolvedValue({ affected: 1 } as UpdateResult);

      const result = await service.uploadAvatar(mockUser.id, mockFile);

      expect(result).toMatch(new RegExp(`^\\/uploads\\/avatars\\/user-${mockUser.id}-\\d+\\.jpg$`));
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        avatar: result,
      });
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UPDATE_USER,
        userId: mockUser.id,
        description: `User with ID ${mockUser.id} updated their avatar`,
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.uploadAvatar('nonexistent', mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.uploadAvatar(mockUser.id, invalidFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = { ...mockFile, size: 6 * 1024 * 1024 }; // 6MB
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.uploadAvatar(mockUser.id, largeFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete old avatar if exists', async () => {
      const userWithAvatar = {
        ...mockUser,
        avatar: '/uploads/avatars/old-avatar.jpg',
      } as unknown as EntityUser;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithAvatar);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      await service.uploadAvatar(mockUser.id, mockFile);

      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar successfully', async () => {
      const userWithAvatar = {
        ...mockUser,
        avatar: '/uploads/avatars/avatar.jpg',
      } as unknown as EntityUser;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithAvatar);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(userRepository, 'update').mockResolvedValue({ affected: 1 } as UpdateResult);

      await service.deleteAvatar(mockUser.id);

      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        avatar: undefined,
      });
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UPDATE_USER,
        userId: mockUser.id,
        description: `User with ID ${mockUser.id} deleted their avatar`,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteAvatar('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user has no avatar', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.deleteAvatar(mockUser.id)).rejects.toThrow(BadRequestException);
    });

    it('should handle file deletion errors gracefully', async () => {
      const userWithAvatar = {
        ...mockUser,
        avatar: '/uploads/avatars/avatar.jpg',
      } as unknown as EntityUser;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithAvatar);
      jest.spyOn(fs, 'existsSync').mockReturnValue(false); // File doesn't exist
      jest.spyOn(userRepository, 'update').mockResolvedValue({ affected: 1 } as UpdateResult);

      await service.deleteAvatar(mockUser.id);

      // Should still succeed even if file doesn't exist
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        avatar: undefined,
      });
    });
  });
});
