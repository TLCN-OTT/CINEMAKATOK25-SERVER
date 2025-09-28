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

import {
  ChangeEmailRequest,
  ChangeEmailResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetProfileResponse,
  ResendEmailChangeOtpResponse,
  UpdateProfileNameRequest,
  UpdateProfileResponse,
  UploadAvatarResponse,
  VerifyEmailChangeRequest,
  VerifyEmailChangeResponse,
} from '../dtos/profile.dto';
import { EntityUser } from '../entities/user.entity';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(EntityUser)
    private readonly userRepository: Repository<EntityUser>,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
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

    return {
      name: user.name,
      email: user.email || '',
      avatar: user.avatar,
      provider: user.provider || 'local',
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateDto: UpdateProfileNameRequest) {
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
      if (updateDto.name) {
        user.name = updateDto.name;
      }

      const updatedUser = await this.userRepository.save(user);

      return {
        success: true,
        message: 'Profile updated successfully',
        profile: {
          name: updatedUser.name,
          email: updatedUser.email || null,
          avatar: updatedUser.avatar,
          provider: updatedUser.provider || 'local',
          isEmailVerified: updatedUser.isEmailVerified,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to update profile',
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
      await this.userRepository.update(user.id, {
        password: hashedNewPassword,
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
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

      return {
        success: true,
        message: 'Avatar uploaded successfully',
        avatarUrl: avatarUrl,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to upload avatar',
      });
    }
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: string): Promise<{ success: boolean; message: string }> {
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

      return {
        success: true,
        message: 'Avatar deleted successfully',
      };
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

  // ============ CHANGE EMAIL WITH OTP METHODS ============

  /**
   * Request email change - sends OTP to new email
   */
  async requestEmailChange(userId: string, changeEmailDto: ChangeEmailRequest) {
    try {
      const { newEmail } = changeEmailDto;

      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'User not found',
        });
      }

      // Check if new email is same as current
      if (user.email && user.email.toLowerCase() === newEmail.toLowerCase()) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'New email is the same as current email',
        });
      }

      // Check if new email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: newEmail.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException({
          code: ERROR_CODE.ALREADY_EXISTS,
          message: 'Email already exists',
        });
      }

      // Check if user has email (required to send OTP)
      if (!user.email) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'Current user has no email to send verification',
        });
      }

      // Generate OTP and send to current (old) email for verification
      const otp = await this.otpService.generateOtp(user.email, OTP_PURPOSE.CHANGE_EMAIL);
      await this.emailService.sendOtpEmail(user.email, otp, 'CHANGE_EMAIL');

      return {
        success: true,
        message:
          'OTP sent to your current email address. Please verify to complete the email change.',
        currentEmail: user.email, // For frontend reference
        newEmail: newEmail.toLowerCase(), // For frontend reference
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to send email change OTP',
      });
    }
  }

  /**
   * Verify email change with OTP
   */
  async verifyEmailChange(userId: string, verifyDto: VerifyEmailChangeRequest) {
    try {
      const { newEmail, otp } = verifyDto;

      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'User not found',
        });
      }

      // Check if new email already exists (double check)
      const existingUser = await this.userRepository.findOne({
        where: { email: newEmail.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException({
          code: ERROR_CODE.ALREADY_EXISTS,
          message: 'Email already exists',
        });
      }

      // Check if user has email (required for OTP verification)
      if (!user.email) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'Current user has no email for verification',
        });
      }

      // Verify OTP using current (old) email
      const isOtpValid = await this.otpService.verifyOtp(
        user.email, // Use current email instead of new email
        otp,
        OTP_PURPOSE.CHANGE_EMAIL,
      );

      if (!isOtpValid) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_TOKEN,
          message: 'Invalid or expired OTP',
        });
      }

      // Update user email
      await this.userRepository.update(userId, {
        email: newEmail.toLowerCase(),
        isEmailVerified: true, // Email is verified through OTP
      });

      return {
        success: true,
        message: 'Email changed successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to verify email change',
      });
    }
  }

  /**
   * Resend OTP for email change
   */
  async resendEmailChangeOtp(userId: string, newEmail: string) {
    try {
      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'User not found',
        });
      }

      // Check if user has current email (required to resend OTP)
      if (!user.email) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_BODY,
          message: 'Current user has no email to resend verification',
        });
      }

      // Check if new email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: newEmail.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException({
          code: ERROR_CODE.ALREADY_EXISTS,
          message: 'Email already exists',
        });
      }

      // Generate new OTP and send to current (old) email
      const otp = await this.otpService.generateOtp(user.email, OTP_PURPOSE.CHANGE_EMAIL);
      await this.emailService.sendOtpEmail(user.email, otp, 'CHANGE_EMAIL');

      return {
        success: true,
        message: 'OTP resent to your current email address successfully',
        currentEmail: user.email, // For frontend reference
        newEmail: newEmail.toLowerCase(), // For frontend reference
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to resend email change OTP',
      });
    }
  }
}
