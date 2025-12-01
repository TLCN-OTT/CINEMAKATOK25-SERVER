import { AuditLogService } from 'src/audit-log/service/audit-log.service';

import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { OTP_PURPOSE } from '@app/common/enums/global.enum';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { PasswordHash } from '@app/common/utils/hash';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ChangePasswordRequest, UpdateProfileRequest } from '../dtos/profile.dto';
import { EntityUser } from '../entities/user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(EntityUser)
    private readonly userRepository: Repository<EntityUser>,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODE.ENTITY_NOT_FOUND,
        message: 'User not found',
      });
    }
    return user;
  }

  /**
   * Update user profile
   * @param userId - The ID of the user to update
   * @param updateDto - The profile update data
   * @returns The updated user profile
   */
  async updateProfile(userId: string, updateDto: UpdateProfileRequest) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'User not found',
        });
      }

      // Update only provided fields
      if (updateDto.name) user.name = updateDto.name;
      if (updateDto.gender) user.gender = updateDto.gender;

      // Validate and update date of birth
      if (updateDto.dateOfBirth) {
        const dateOfBirth = new Date(updateDto.dateOfBirth);
        if (isNaN(dateOfBirth.getTime())) {
          throw new BadRequestException({
            code: ERROR_CODE.INVALID_BODY,
            message: 'Invalid date of birth format',
          });
        }
        user.dateOfBirth = dateOfBirth;
      }

      if (updateDto.address) user.address = updateDto.address;

      // Validate and update phone number
      if (updateDto.phoneNumber) {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
        if (!phoneRegex.test(updateDto.phoneNumber)) {
          throw new BadRequestException({
            code: ERROR_CODE.INVALID_BODY,
            message: 'Invalid phone number format',
          });
        }
        user.phoneNumber = updateDto.phoneNumber;
      }

      const updatedUser = await this.userRepository.save(user);
      await this.auditLogService.log({
        action: LOG_ACTION.UPDATE_USER,
        userId: user.id,
        description: `User ${user.email} updated their profile`,
      });
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to update profile',
        error: error.message,
      });
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordRequest) {
    try {
      const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

      // Check if new password and confirmation match
      if (newPassword !== confirmPassword) {
        await this.auditLogService.log({
          action: LOG_ACTION.CHANGE_PASSWORD,
          userId: userId,
          description: `User with ID ${userId} provided non-matching new password and confirmation`,
        });
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'New password and confirmation do not match',
        });
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        await this.auditLogService.log({
          action: LOG_ACTION.CHANGE_PASSWORD,
          userId: userId,
          description: `User with ID ${userId} not found when attempting to change password`,
        });
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'User not found',
        });
      }

      // Check if user has password (social login users might not have password)
      if (!user.password) {
        await this.auditLogService.log({
          action: LOG_ACTION.CHANGE_PASSWORD,
          userId: user.id,
          description: `User ${user.email} attempted to change password but has no password set`,
        });

        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'Cannot change password for social login accounts',
        });
      }

      // Verify current password
      const isCurrentPasswordValid = PasswordHash.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        await this.auditLogService.log({
          action: LOG_ACTION.CHANGE_PASSWORD,
          userId: user.id,
          description: `User ${user.email} provided incorrect current password`,
        });
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_PASSWORD,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedNewPassword = PasswordHash.hashPassword(newPassword);
      await this.auditLogService.log({
        action: LOG_ACTION.CHANGE_PASSWORD,
        userId: user.id,
        description: `User ${user.email} changed their password`,
      });
      // Update password
      return await this.userRepository.update(user.id, {
        password: hashedNewPassword,
      });
    } catch (error) {
      await this.auditLogService.log({
        action: LOG_ACTION.CHANGE_PASSWORD,
        userId: userId,
        description: `User with ID ${userId} failed to change password`,
      });
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to change password',
      });
    }
  }

  /**
   * Update user avatar with URL
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'User not found',
        });
      }

      // Update user avatar in database
      await this.userRepository.update(userId, {
        avatar: avatarUrl,
      });

      await this.auditLogService.log({
        action: LOG_ACTION.UPDATE_USER,
        userId: userId,
        description: `User with ID ${userId} updated their avatar`,
      });

      return avatarUrl;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to update avatar',
      });
    }
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        await this.auditLogService.log({
          action: LOG_ACTION.UPDATE_USER,
          userId: userId,
          description: `User with ID ${userId} not found when attempting to delete avatar`,
        });
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'User not found',
        });
      }

      if (!user.avatar) {
        await this.auditLogService.log({
          action: LOG_ACTION.UPDATE_USER,
          userId: userId,
          description: `User with ID ${userId} has no avatar to delete`,
        });
        throw new BadRequestException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'No avatar to delete',
        });
      }

      // Update database to remove avatar
      await this.userRepository.update(userId, {
        avatar: undefined,
      });

      await this.auditLogService.log({
        action: LOG_ACTION.UPDATE_USER,
        userId: userId,
        description: `User with ID ${userId} deleted their avatar`,
      });
    } catch (error) {
      await this.auditLogService.log({
        action: LOG_ACTION.UPDATE_USER,
        userId: userId,
        description: `Failed to delete avatar for user with ID ${userId}: ${error.message}`,
      });
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to delete avatar',
      });
    }
  }
}
