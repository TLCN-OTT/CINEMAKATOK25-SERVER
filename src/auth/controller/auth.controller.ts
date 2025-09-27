import { SkipAuth } from '@app/common/constants/global.constants';
import { ApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { Body, Controller, HttpCode, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  AuthRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  RegisterRequest,
  RegisterResponse,
  RegisterWithOtpRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SocialLoginRequest,
  SocialLoginResponse,
  TokenRequest,
  TokenResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../dtos/auth.dto';
import { AuthService } from '../service/auth.service';
import { UserService } from '../service/user.service';

@Controller({
  path: 'auth',
  version: '1',
})
@ApiTags('gsa / Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('/login')
  @SkipAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: AuthRequest })
  @ApiOkResponse({ description: 'Login success', type: ApiResponseDto(TokenResponse) })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  async login(@Body() authRequest: AuthRequest) {
    return ResponseBuilder.createResponse({ data: await this.authService.auth(authRequest) });
  }
  // ============ SOCIAL LOGIN ENDPOINT ============

  @Post('/social-login')
  @SkipAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Social login with Google/Facebook',
    description:
      'Login or register using Google/Facebook OAuth. Automatically creates account if user does not exist.',
  })
  @ApiBody({ type: SocialLoginRequest })
  @ApiResponse({
    status: 200,
    description: 'Social login successful',
    type: ApiResponseDto(SocialLoginResponse),
  })
  @ApiResponse({ status: 400, description: 'Invalid social access token' })
  async socialLogin(@Body() socialLoginDto: SocialLoginRequest) {
    const result = await this.authService.socialLogin(socialLoginDto);
    return ResponseBuilder.createResponse({ data: result });
  }

  @Post('/refresh')
  @SkipAuth()
  @ApiBody({ type: TokenRequest })
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ description: 'Refresh token success', type: ApiResponseDto(TokenResponse) })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() token: TokenRequest) {
    return ResponseBuilder.createResponse({
      data: await this.authService.refresh(token),
    });
  }
  @Post('/logout')
  @ApiBody({ type: TokenRequest })
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout user' })
  @ApiOkResponse({ description: 'Logout success' })
  async logout(@Body() token: TokenRequest) {
    await this.authService.logout(token);
    return ResponseBuilder.createResponse({
      data: null,
    });
  }
  // ============ REGISTER ENDPOINTS ============
  @Post('/register/send-otp')
  @SkipAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send OTP for registration',
    description:
      'Sends a 6-digit OTP to user email for account verification during registration. OTP expires in 5 minutes.',
  })
  @ApiBody({ type: RegisterRequest })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: ApiResponseDto(ForgotPasswordResponse),
  })
  @ApiResponse({ status: 400, description: 'Email already exists or invalid data' })
  async sendRegisterOtp(@Body() registerDto: RegisterRequest) {
    const result = await this.authService.sendRegisterOtp(registerDto);
    return ResponseBuilder.createResponse({ data: result });
  }

  @Post('/register/verify')
  @SkipAuth()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Complete registration with OTP verification',
    description:
      'Creates a new user account after OTP verification. Returns JWT tokens for immediate login.',
  })
  @ApiBody({ type: RegisterWithOtpRequest })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: ApiResponseDto(RegisterResponse),
  })
  @ApiResponse({ status: 400, description: 'Invalid OTP or registration data' })
  async registerWithOtp(@Body() registerWithOtpDto: RegisterWithOtpRequest) {
    const result = await this.authService.registerWithOtp(registerWithOtpDto);
    return ResponseBuilder.createResponse({ data: result });
  }

  @Post('/register/resend-otp')
  @SkipAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Resend OTP for registration',
    description:
      'Resends a new 6-digit OTP to user email for registration. Previous OTPs will be invalidated.',
  })
  @ApiQuery({
    name: 'email',
    description: 'User email address to resend OTP',
    example: 'user@example.com',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'New OTP sent successfully',
    type: ApiResponseDto(ForgotPasswordResponse),
  })
  @ApiResponse({ status: 400, description: 'Email already exists or failed to resend OTP' })
  async resendRegisterOtp(@Query('email') email: string) {
    const result = await this.authService.resendRegisterOtp(email);
    return ResponseBuilder.createResponse({ data: result });
  }

  // ============ FORGOT PASSWORD ENDPOINTS ============

  @Post('/forgot-password')
  @SkipAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send OTP for password reset',
    description:
      "Sends a 6-digit OTP to the user's email for password reset. OTP expires in 5 minutes.",
  })
  @ApiBody({ type: ForgotPasswordRequest })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: ApiResponseDto(ForgotPasswordResponse),
  })
  @ApiResponse({ status: 400, description: 'Failed to send OTP' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordRequest) {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return ResponseBuilder.createResponse({ data: result });
  }

  @Post('/reset-password')
  @SkipAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reset password with OTP',
    description:
      'Resets user password using verified OTP. The OTP will be marked as used after successful reset.',
  })
  @ApiBody({ type: ResetPasswordRequest })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: ApiResponseDto(ResetPasswordResponse),
  })
  @ApiResponse({ status: 400, description: 'Invalid OTP or password requirements not met' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordRequest) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return ResponseBuilder.createResponse({ data: result });
  }

  @Post('/resend-otp')
  @SkipAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Resend OTP',
    description: "Resends OTP to user's email. Previous OTPs will be invalidated.",
  })
  @ApiQuery({
    name: 'email',
    description: 'User email address',
    example: 'user@example.com',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'OTP resent successfully',
    type: ApiResponseDto(ForgotPasswordResponse),
  })
  @ApiResponse({ status: 400, description: 'Failed to resend OTP' })
  async resendOtp(@Query('email') email: string) {
    const result = await this.authService.resendOtp(email);
    return ResponseBuilder.createResponse({ data: result });
  }
}
