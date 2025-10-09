import * as fs from 'fs';
import * as path from 'path';

import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { OTP_PURPOSE } from '@app/common/enums/global.enum';
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
import { EmailService } from './email.service';
import { OtpService } from './otp.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(EntityUser)
    private readonly userRepository: Repository<EntityUser>,
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
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'New password and confirmation do not match',
        });
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'User not found',
        });
      }

      // Check if user has password (social login users might not have password)
      if (!user.password) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'Cannot change password for social login accounts',
        });
      }

      // Verify current password
      const isCurrentPasswordValid = PasswordHash.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_PASSWORD,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedNewPassword = PasswordHash.hashPassword(newPassword);

      // Update password
      return await this.userRepository.update(user.id, {
        password: hashedNewPassword,
      });
    } catch (error) {
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to change password',
      });
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: any) {
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

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
        });
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'File size too large. Maximum 5MB allowed',
        });
      }

      // Create upload directory if not exists
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Delete old avatar if exists
      if (user.avatar) {
        const oldAvatarPath = path.join(
          process.cwd(),
          'uploads',
          'avatars',
          path.basename(user.avatar),
        );
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `user-${userId}-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Save file
      fs.writeFileSync(filePath, file.buffer);

      // Generate avatar URL
      const avatarUrl = `/uploads/avatars/${fileName}`;

      // Update user avatar in database
      await this.userRepository.update(userId, {
        avatar: avatarUrl,
      });

      return avatarUrl;
    } catch (error) {
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to upload avatar',
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
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'User not found',
        });
      }

      if (!user.avatar) {
        throw new BadRequestException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'No avatar to delete',
        });
      }

      // Delete file from filesystem
      const avatarPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }

      // Update database
      await this.userRepository.update(userId, {
        avatar: undefined,
      });
    } catch (error) {
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
