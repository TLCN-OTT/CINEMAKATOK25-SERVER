import * as config from 'config';
import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { OTP_PURPOSE } from '@app/common/enums/global.enum';
import { getConfig } from '@app/common/utils/get-config';
import { PasswordHash } from '@app/common/utils/hash';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { JwtPayload } from '../constants/jwt-payload';
import {
  AuthRequest,
  ForgotPasswordRequest,
  LoginResponse,
  OTPResponse,
  RegisterRequest,
  RegisterWithOtpRequest,
  ResetPasswordRequest,
  SocialLoginRequest,
  TokenRequest,
  TokenResponse,
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
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      token: new TokenResponse(accessToken, refreshToken),
    };
  }
  async loginGoogle(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException({ code: ERROR_CODE.USER_NOT_FOUND });
    const { accessToken, refreshToken } = await this.generateTokens({
      sub: user.id,
    });
    await this.saveRefreshToken(refreshToken, user.id);
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      token: new TokenResponse(accessToken, refreshToken),
    };
  }

  async refresh(token: TokenRequest) {
    const existedToken = await this.checkRefreshToken(token.refreshToken);
    const { accessToken, refreshToken } = await this.generateTokens({
      sub: existedToken.userId,
    });
    await this.saveRefreshToken(refreshToken, existedToken.userId);
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
  async forgotPassword(forgotPasswordDto: ForgotPasswordRequest): Promise<OTPResponse> {
    const { email } = forgotPasswordDto;

    try {
      await this.usersService.findByEmail(email);
    } catch (error) {
      throw new NotFoundException({
        code: ERROR_CODE.USER_NOT_FOUND,
        message: 'User with this email does not exist',
      });
    }

    try {
      const otp = await this.otpService.generateOtp(email, OTP_PURPOSE.FORGOT_PASSWORD);

      await this.emailService.sendOtpEmail(email, otp, 'FORGOT_PASSWORD');

      return new OTPResponse(5);
    } catch (error) {
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to send OTP. Please try again',
      });
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordRequest) {
    const { email, otp, newPassword } = resetPasswordDto;

    try {
      const user = await this.usersService.findByEmail(email);

      const isValid = await this.otpService.verifyOtp(email, otp, OTP_PURPOSE.FORGOT_PASSWORD);
      if (!isValid) {
        throw new BadRequestException({
          code: ERROR_CODE.INVALID_OTP,
          message: 'Invalid or expired OTP',
        });
      }

      const hashedPassword = PasswordHash.hashPassword(newPassword);
      await this.userRepository.update(user.id, { password: hashedPassword });

      await this.otpService.cleanupExpiredOtpsByEmail(email);
      await this.otpService.cleanupExpiredOtps();

      try {
        await this.emailService.sendPasswordResetConfirmation(email);
      } catch (err) {
        throw new BadRequestException({
          code: ERROR_CODE.UNEXPECTED_ERROR,
          message: 'Password changed but failed to send confirmation email',
        });
      }
      return;
    } catch (error) {
      throw new NotFoundException({
        code: ERROR_CODE.USER_NOT_FOUND,
        message: 'User with this email does not exist',
      });
    }
  }

  async resendOtp(email: string): Promise<OTPResponse> {
    try {
      await this.usersService.findByEmail(email);

      const otp = await this.otpService.generateOtp(email, OTP_PURPOSE.FORGOT_PASSWORD);

      await this.emailService.sendOtpEmail(email, otp, 'FORGOT_PASSWORD');

      return new OTPResponse(5);
    } catch (error) {
      throw new NotFoundException({
        code: ERROR_CODE.USER_NOT_FOUND,
        message: 'User with this email does not exist',
      });
    }
  }

  // ============ REGISTRATION METHODS ============

  /**
   * Send OTP for registration
   */
  async sendRegisterOtp(registerDto: RegisterRequest): Promise<OTPResponse> {
    const { email } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException({
        code: ERROR_CODE.ALREADY_EXISTS,
        message: 'User with this email already exists',
      });
    }

    const otp = await this.otpService.generateOtp(email, OTP_PURPOSE.REGISTRATION);
    await this.emailService.sendOtpEmail(email, otp, 'REGISTRATION');

    return new OTPResponse(5);
  }

  /**
   * Complete registration with OTP verification
   */
  async registerWithOtp(registerWithOtpDto: RegisterWithOtpRequest) {
    const { name, email, password, otp, dateOfBirth, gender } = registerWithOtpDto;

    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException({
        code: ERROR_CODE.ALREADY_EXISTS,
        message: 'User with this email already exists',
      });
    }

    const isOtpValid = await this.otpService.verifyOtp(email, otp, OTP_PURPOSE.REGISTRATION);

    if (!isOtpValid) {
      throw new BadRequestException({
        code: ERROR_CODE.INVALID_OTP,
        message: 'Invalid or expired OTP',
      });
    }

    const hashedPassword = PasswordHash.hashPassword(password);
    const userData: any = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: true,
    };

    // Add optional fields if provided
    if (dateOfBirth) {
      userData.dateOfBirth = new Date(dateOfBirth);
    }
    if (gender) {
      userData.gender = gender;
    }

    const user = await this.userRepository.save(userData);
  }

  /**
   * Resend OTP for registration
   */
  async resendRegisterOtp(email: string): Promise<OTPResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException({
        code: ERROR_CODE.ALREADY_EXISTS,
        message: 'User with this email already exists',
      });
    }

    const otp = await this.otpService.generateOtp(email, OTP_PURPOSE.REGISTRATION);
    await this.emailService.sendOtpEmail(email, otp, 'REGISTRATION');

    return new OTPResponse(5);
  }

  // ============ SOCIAL LOGIN METHODS ============

  /**
   * Social login (Google/Facebook)
   */
  async socialLogin(socialLoginDto: SocialLoginRequest): Promise<LoginResponse> {
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

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        token: new TokenResponse(jwtAccessToken, refreshToken),
      };
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
      return result;
    }
  }
}
