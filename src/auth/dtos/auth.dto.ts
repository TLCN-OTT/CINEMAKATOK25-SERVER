import { Expose } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AuthRequest {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  @Expose()
  password: string;
}

export class TokenResponse {
  @ApiProperty({
    description: 'Access token',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token',
  })
  @Expose()
  refreshToken: string;

  constructor(a_token: string, r_token: string) {
    this.accessToken = a_token;
    this.refreshToken = r_token;
  }
}

export class TokenRequest {
  @ApiProperty({
    description: 'jwt token',
  })
  @IsString()
  @Expose()
  refreshToken: string;
}

// ============ Forgot Password DTOs ============
export class ForgotPasswordRequest {
  @ApiProperty({
    description: 'User email to send OTP',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Expose()
  email: string;
}

export class VerifyOtpRequest {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'OTP code (6 digits)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'OTP is required' })
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  @Expose()
  otp: string;
}

export class ResetPasswordRequest {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'OTP code (6 digits)',
    example: '123456',
  })
  @IsString({ message: 'OTP is required' })
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  @Expose()
  otp: string;

  @ApiProperty({
    description: 'New password',
    example: 'newPassword123!',
    minLength: 8,
  })
  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one number and one special character',
  })
  @Expose()
  newPassword: string;
}

export class ForgotPasswordResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'OTP has been sent to your email' })
  @Expose()
  message: string;

  @ApiProperty({ example: 5 })
  @Expose()
  otpExpiryMinutes: number;

  constructor(success: boolean, message: string, otpExpiryMinutes: number = 5) {
    this.success = success;
    this.message = message;
    this.otpExpiryMinutes = otpExpiryMinutes;
  }
}

export class ResetPasswordResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Password has been reset successfully' })
  @Expose()
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}

export class VerifyOtpResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'OTP verified successfully' })
  @Expose()
  message: string;

  @ApiProperty({ example: true })
  @Expose()
  verified: boolean;

  constructor(success: boolean, message: string, verified: boolean = true) {
    this.success = success;
    this.message = message;
    this.verified = verified;
  }
}

// ============ Registration DTOs ============
export class RegisterRequest {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString({ message: 'Name is required' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password!123',
    minLength: 8,
  })
  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one number and one special character',
  })
  @Expose()
  password: string;
}

export class RegisterWithOtpRequest extends RegisterRequest {
  @ApiProperty({
    description: 'OTP code (6 digits)',
    example: '123456',
  })
  @IsString({ message: 'OTP is required' })
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  @Expose()
  otp: string;
}

export class RegisterResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Registration successful' })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 'uuid-123',
      name: 'John Doe',
      email: 'user@example.com',
      isEmailVerified: true,
    },
  })
  @Expose()
  user: {
    id: string;
    name: string;
    email: string;
    isEmailVerified: boolean;
  } | null;

  constructor(
    success: boolean,
    message: string,
    user: { id: string; name: string; email: string; isEmailVerified: boolean } | null,
  ) {
    this.success = success;
    this.message = message;
    this.user = user;
  }
}

// ============ SOCIAL LOGIN DTOs ============
export class SocialLoginRequest {
  @ApiProperty({
    description: 'Social provider',
    example: 'google',
    enum: ['google', 'facebook'],
  })
  @IsString({ message: 'Provider is required' })
  @IsNotEmpty({ message: 'Provider cannot be empty' })
  @IsIn(['google', 'facebook'], { message: 'Provider must be either google or facebook' })
  @Expose()
  provider: 'google' | 'facebook';

  @ApiProperty({
    description: 'Access token from social provider',
    example: 'ya29.a0ARrd...',
  })
  @IsString({ message: 'Access token is required' })
  @IsNotEmpty({ message: 'Access token cannot be empty' })
  @Expose()
  accessToken: string;
}

export class SocialLoginResponse {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Login successful' })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 'uuid-123',
      name: 'John Doe',
      email: 'john@gmail.com',
      isEmailVerified: true,
      provider: 'google',
      avatar: 'https://lh3.googleusercontent.com/...',
    },
  })
  @Expose()
  user: {
    id: string;
    name: string;
    email: string | null;
    isEmailVerified: boolean;
    provider: string;
    avatar?: string;
  };

  @ApiProperty({
    description: 'JWT tokens',
    example: {
      accessToken: 'eyJhbGciOiJSUzI1NiIs...',
      refreshToken: 'eyJhbGciOiJSUzI1NiIs...',
    },
  })
  @Expose()
  tokens: {
    accessToken: string;
    refreshToken: string;
  };

  constructor(
    success: boolean,
    message: string,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    this.success = success;
    this.message = message;
    this.tokens = tokens;
  }
}
