import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

// ============ PROFILE DTOs ============

export class GetProfileResponse {
  @ApiProperty({
    description: 'User profile information',
    example: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
      provider: 'local',
      isEmailVerified: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  })
  @Expose()
  profile: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  constructor(profile: any) {
    this.profile = profile;
  }
}

// export class UpdateProfileRequest {
//   @ApiProperty({
//     description: 'User full name',
//     example: 'John Doe Updated',
//     required: true,
//   })
//   @IsString({ message: 'Name must be a string' })
//   @MinLength(2, { message: 'Name must be at least 2 characters long' })
//   @Expose()
//   name: string;
//   // Add other fields if needed in the future
// }

export class UpdateProfileNameRequest {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe Updated',
    required: true,
  })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @Expose()
  name: string;
  // Add other fields if needed in the future
}
export class UpdateProfileResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Profile updated successfully' })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Updated user profile',
    example: {
      name: 'John Doe Updated',
      email: 'newemail@example.com',
      avatar: 'https://example.com/avatar.jpg',
    },
  })
  @Expose()
  profile: {
    name: string;
    email: string;
    avatar?: string;
    provider: string;
    isEmailVerified: boolean;
  };

  constructor(
    success: boolean,
    message: string,
    profile: {
      name: string;
      email: string;
      avatar?: string;
      provider: string;
      isEmailVerified: boolean;
    },
  ) {
    this.success = success;
    this.message = message;
    this.profile = profile;
  }
}

export class ChangePasswordRequest {
  @ApiProperty({
    description: 'Current password',
    example: 'currentPassword123',
  })
  @IsString({ message: 'Current password is required' })
  @IsNotEmpty({ message: 'Current password cannot be empty' })
  @Expose()
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsString({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one number and one special character',
  })
  @Expose()
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewPassword123!',
  })
  @IsString({ message: 'Password confirmation is required' })
  @IsNotEmpty({ message: 'Password confirmation cannot be empty' })
  @Expose()
  confirmPassword: string;
}

export class ChangePasswordResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Password changed successfully' })
  @Expose()
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}

export class UploadAvatarResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Avatar uploaded successfully' })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'New avatar URL',
    example: 'https://example.com/uploads/avatars/user-123-1234567890.jpg',
  })
  @Expose()
  avatarUrl: string;

  constructor(success: boolean, message: string, avatarUrl: string) {
    this.success = success;
    this.message = message;
    this.avatarUrl = avatarUrl;
  }
}

// ============ CHANGE EMAIL WITH OTP DTOs ============

export class ChangeEmailRequest {
  @ApiProperty({
    description: 'New email address',
    example: 'newemail@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @Expose()
  newEmail: string;
}

export class ChangeEmailResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({
    example: 'OTP sent to your current email address. Please verify to complete the email change.',
  })
  @Expose()
  message: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Current email address where OTP was sent',
    required: false,
  })
  @Expose()
  currentEmail?: string;

  @ApiProperty({
    example: 'newemail@example.com',
    description: 'New email address to change to',
    required: false,
  })
  @Expose()
  newEmail?: string;

  constructor(success: boolean, message: string, currentEmail?: string, newEmail?: string) {
    this.success = success;
    this.message = message;
    this.currentEmail = currentEmail;
    this.newEmail = newEmail;
  }
}

export class VerifyEmailChangeRequest {
  @ApiProperty({
    description: 'New email address',
    example: 'newemail@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @Expose()
  newEmail: string;

  @ApiProperty({
    description: '6-digit OTP sent to new email',
    example: '123456',
  })
  @IsString({ message: 'OTP is required' })
  @IsNotEmpty({ message: 'OTP cannot be empty' })
  @Expose()
  otp: string;
}

export class VerifyEmailChangeResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Email changed successfully' })
  @Expose()
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}

export class ResendEmailChangeOtpResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'OTP resent to your current email address successfully' })
  @Expose()
  message: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Current email address where OTP was resent',
    required: false,
  })
  @Expose()
  currentEmail?: string;

  @ApiProperty({
    example: 'newemail@example.com',
    description: 'New email address to change to',
    required: false,
  })
  @Expose()
  newEmail?: string;

  constructor(success: boolean, message: string, currentEmail?: string, newEmail?: string) {
    this.success = success;
    this.message = message;
    this.currentEmail = currentEmail;
    this.newEmail = newEmail;
  }
}
