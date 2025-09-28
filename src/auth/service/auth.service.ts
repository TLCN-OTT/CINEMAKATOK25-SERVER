import * as config from 'config';
import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { OTP_PURPOSE } from '@app/common/enums/global.enum';
import { getConfig } from '@app/common/utils/get-config';
import { PasswordHash } from '@app/common/utils/hash';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { JwtPayload } from '../constants/jwt-payload';
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
import { CreateUserDto } from '../dtos/user.dto';
import { EntityRefreshToken } from '../entities/refreshtoken.entity';
import { EntityUser } from '../entities/user.entity';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import { SocialAuthService } from './social-auth.service';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  private readonly refreshExpiresTime = config.get('jwt.refreshExpiresTime');
  constructor(
    private readonly usersService: UserService,
    @InjectRepository(EntityRefreshToken)
    private readonly tokenRepository: Repository<EntityRefreshToken>,
    @InjectRepository(EntityUser)
    private readonly userRepository: Repository<EntityUser>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly socialAuthService: SocialAuthService,
  ) {}
  async auth(AuthRequest: AuthRequest) {
    const user = await this.usersService.findByEmail(AuthRequest.email);
    if (!PasswordHash.comparePassword(AuthRequest.password, user.password)) {
      throw new BadRequestException({ code: ERROR_CODE.INVALID_PASSWORD });
    }
    const { accessToken, refreshToken } = await this.generateTokens({
      sub: user.id,
    });
    await this.saveRefreshToken(refreshToken, user.id);
    return new TokenResponse(accessToken, refreshToken);
  }
  async loginGoogle(email: string): Promise<TokenResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException({ code: ERROR_CODE.USER_NOT_FOUND });
    const { accessToken, refreshToken } = await this.generateTokens({
      sub: user.id,
    });
    await this.saveRefreshToken(refreshToken, user.id);
    return new TokenResponse(accessToken, refreshToken);
  }

  async refresh(token: TokenRequest) {
    const existedToken = await this.checkRefreshToken(token.refreshToken);
    const { accessToken, refreshToken } = await this.generateTokens({
      sub: existedToken.userId,
    });
    await this.logout(token);
    return new TokenResponse(accessToken, refreshToken);
  }
  private async checkRefreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (!payload.isRefresh) {
        throw new Error();
      }
      const existedToken = await this.tokenRepository.findOneBy({
        userId: payload.sub,
        token: token,
      });
      if (!existedToken) {
        throw new Error();
      }
      return existedToken;
    } catch (err: any) {
      throw new UnauthorizedException({ code: ERROR_CODE.INVALID_TOKEN });
    }
  }
  private async saveRefreshToken(token: string, userId: string) {
    return await this.tokenRepository.save({
      token: token,
      userId: userId,
    });
  }
  async logout(token: TokenRequest) {
    await this.tokenRepository.delete({ token: token.refreshToken });
  }

  private generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { ...payload, isRefresh: true } as object,
      { expiresIn: this.refreshExpiresTime } as JwtSignOptions,
    );
    return { accessToken, refreshToken };
  }

  /**
   * Send OTP for password reset
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const { email } = forgotPasswordDto;

    try {
      await this.usersService.findByEmail(email);
    } catch (error) {
      return new ForgotPasswordResponse(
        true,
        'If the email exists, OTP has been sent to your email',
        5,
      );
    }

    try {
      const otp = await this.otpService.generateOtp(email, OTP_PURPOSE.FORGOT_PASSWORD);

      await this.emailService.sendOtpEmail(email, otp, 'FORGOT_PASSWORD');

      return new ForgotPasswordResponse(
        true,
        'If the email exists, OTP has been sent to your email',
        5,
      );
    } catch (error) {
      return new ForgotPasswordResponse(false, 'Failed to send OTP. Please try again', 0);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const { email, otp, newPassword } = resetPasswordDto;

    try {
      const user = await this.usersService.findByEmail(email);

      const isValid = await this.otpService.verifyOtp(email, otp, OTP_PURPOSE.FORGOT_PASSWORD);
      if (!isValid) {
        return new ResetPasswordResponse(false, 'Invalid or expired OTP');
      }

      const hashedPassword = PasswordHash.hashPassword(newPassword);
      await this.userRepository.update(user.id, { password: hashedPassword });

      await this.otpService.cleanupExpiredOtpsByEmail(email);
      await this.otpService.cleanupExpiredOtps();

      try {
        await this.emailService.sendPasswordResetConfirmation(email);
      } catch (err) {
        console.error('Failed to send confirmation email:', err);
      }

      return new ResetPasswordResponse(true, 'Password has been reset successfully');
    } catch (error) {
      return new ResetPasswordResponse(false, 'Failed to reset password. Please try again');
    }
  }

  async resendOtp(email: string): Promise<ForgotPasswordResponse> {
    try {
      await this.usersService.findByEmail(email);

      const otp = await this.otpService.generateOtp(email, OTP_PURPOSE.FORGOT_PASSWORD);

      await this.emailService.sendOtpEmail(email, otp, 'FORGOT_PASSWORD');

      return new ForgotPasswordResponse(true, 'New OTP has been sent to your email', 5);
    } catch (error) {
      return new ForgotPasswordResponse(false, 'Failed to resend OTP. Please try again', 0);
    }
  }

  // ============ REGISTRATION METHODS ============

  /**
   * Send OTP for registration
   */
  async sendRegisterOtp(registerDto: RegisterRequest): Promise<ForgotPasswordResponse> {
    const { name, email, password } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return new ForgotPasswordResponse(false, 'User with this email already exists', 0);
    }

    const otp = await this.otpService.generateOtp(email, OTP_PURPOSE.REGISTRATION);
    await this.emailService.sendOtpEmail(email, otp, 'REGISTRATION');

    return new ForgotPasswordResponse(true, 'OTP sent to your email', 5);
  }

  /**
   * Complete registration with OTP verification
   */
  async registerWithOtp(registerWithOtpDto: RegisterWithOtpRequest): Promise<RegisterResponse> {
    const { name, email, password, otp } = registerWithOtpDto;

    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return new RegisterResponse(false, 'User with this email already exists', null);
    }

    const isOtpValid = await this.otpService.verifyOtp(email, otp, OTP_PURPOSE.REGISTRATION);

    if (!isOtpValid) {
      return new RegisterResponse(false, 'Invalid or expired OTP', null);
    }

    const hashedPassword = PasswordHash.hashPassword(password);
    const user = await this.userRepository.save({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: true,
    });

    return new RegisterResponse(true, 'Registration successful', {
      id: user.id,
      name: user.name,
      email: user.email ?? null,
      isEmailVerified: user.isEmailVerified,
    });
  }

  /**
   * Resend OTP for registration
   */
  async resendRegisterOtp(email: string): Promise<ForgotPasswordResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return new ForgotPasswordResponse(false, 'User with this email already exists', 0);
    }

    const otp = await this.otpService.generateOtp(email, OTP_PURPOSE.REGISTRATION);
    await this.emailService.sendOtpEmail(email, otp, 'REGISTRATION');

    return new ForgotPasswordResponse(true, 'New OTP sent to your email', 5);
  }

  // ============ SOCIAL LOGIN METHODS ============

  /**
   * Social login (Google/Facebook)
   */
  async socialLogin(socialLoginDto: SocialLoginRequest): Promise<SocialLoginResponse> {
    try {
      const { provider, accessToken } = socialLoginDto;

      const socialUser = await this.socialAuthService.verifySocialToken(provider, accessToken);

      const normalizedEmail = socialUser.email ? socialUser.email.toLowerCase() : null;

      let user: EntityUser | null = null;

      if (normalizedEmail) {
        user = await this.userRepository.findOne({
          where: { email: normalizedEmail },
        });
      }

      if (!user) {
        user = await this.userRepository.findOne({
          where: { provider, providerId: socialUser.id },
        });
      }

      if (user) {
        if (user.provider !== provider || user.providerId !== socialUser.id) {
          user.provider = provider;
          user.providerId = socialUser.id;
        }
        user.avatar = socialUser.picture || user.avatar;
        user.isEmailVerified = !!socialUser.email;

        await this.userRepository.save(user);
      } else {
        const newUser = this.userRepository.create({
          name: socialUser.name,
          email: normalizedEmail,
          password: '',
          isEmailVerified: !!socialUser.email,
          provider,
          providerId: socialUser.id,
          avatar: socialUser.picture,
        });

        user = await this.userRepository.save(newUser);
      }

      // Generate JWT
      const { accessToken: jwtAccessToken, refreshToken } = await this.generateTokens({
        sub: user.id,
      });
      await this.saveRefreshToken(refreshToken, user.id);

      return new SocialLoginResponse(true, 'Login successful', {
        accessToken: jwtAccessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Social login error:', error);
      if (error.message?.includes('Invalid') && error.message?.includes('access token')) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_TOKEN,
          message: 'Invalid social access token',
        });
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to login with social provider. Please try again.',
      });
    }
  }

  async validateGoogleUser(googleUser: CreateUserDto) {
    try {
      const user = await this.usersService.findByEmail(googleUser.email);
      return user;
    } catch (error) {
      const result = await this.usersService.create(googleUser);
      console.log('asdsd', result);
      return result;
    }
  }
}
