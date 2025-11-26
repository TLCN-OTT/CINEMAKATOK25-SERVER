import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { OTP_PURPOSE } from '@app/common/enums/global.enum';
import { PasswordHash } from '@app/common/utils/hash';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditLogService } from '../../../audit-log/service/audit-log.service';
import {
  AuthRequest,
  ForgotPasswordRequest,
  OTPResponse,
  RegisterRequest,
  RegisterWithOtpRequest,
  ResetPasswordRequest,
  SocialLoginRequest,
  TokenRequest,
  TokenResponse,
} from '../../dtos/auth.dto';
import { EntityRefreshToken } from '../../entities/refreshtoken.entity';
import { EntityUser } from '../../entities/user.entity';
import { AuthService } from '../auth.service';
import { EmailService } from '../email.service';
import { OtpService } from '../otp.service';
import { SocialAuthService } from '../social-auth.service';
import { UserService } from '../user.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<EntityUser>;
  let refreshTokenRepository: Repository<EntityRefreshToken>;
  let userService: UserService;
  let otpService: OtpService;
  let emailService: EmailService;
  let socialAuthService: SocialAuthService;
  let auditLogService: AuditLogService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    isAdmin: false,
    isEmailVerified: true,
    provider: null,
    providerId: null,
    avatar: null,
    address: null,
    phoneNumber: null,
    status: 'ACTIVATED',
    banReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockRefreshToken = {
    id: 'refresh-1',
    token: 'refreshToken',
    userId: mockUser.id,
    issuedDate: new Date(),
  } as EntityRefreshToken;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(EntityUser),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityRefreshToken),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            banUser: jest.fn(),
            unbanUser: jest.fn(),
          },
        },
        {
          provide: OtpService,
          useValue: {
            generateOtp: jest.fn(),
            verifyOtp: jest.fn(),
            isOtpValid: jest.fn(),
            cleanupExpiredOtpsByEmail: jest.fn(),
            cleanupExpiredOtps: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendOtpEmail: jest.fn(),
            sendPasswordResetConfirmation: jest.fn(),
          },
        },
        {
          provide: SocialAuthService,
          useValue: {
            verifyGoogleToken: jest.fn(),
            verifySocialToken: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<EntityUser>>(getRepositoryToken(EntityUser));
    refreshTokenRepository = module.get<Repository<EntityRefreshToken>>(
      getRepositoryToken(EntityRefreshToken),
    );
    userService = module.get<UserService>(UserService);
    otpService = module.get<OtpService>(OtpService);
    emailService = module.get<EmailService>(EmailService);
    socialAuthService = module.get<SocialAuthService>(SocialAuthService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
    jwtService = module.get<JwtService>(JwtService);

    // Set up default mocks
    jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
    jest.spyOn(otpService, 'verifyOtp').mockResolvedValue(true);
    jest.spyOn(emailService, 'sendPasswordResetConfirmation').mockResolvedValue(undefined);
    jest.spyOn(userRepository, 'update').mockResolvedValue({ affected: 1 } as any);
    jest.spyOn(otpService, 'cleanupExpiredOtpsByEmail').mockResolvedValue(undefined);
    jest.spyOn(otpService, 'cleanupExpiredOtps').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('auth', () => {
    const authRequest: AuthRequest = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');
      jest.spyOn(refreshTokenRepository, 'save').mockResolvedValue(mockRefreshToken);
      jest.spyOn(PasswordHash, 'comparePassword').mockReturnValue(true);
      const result = await service.auth(authRequest);

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        avatar: mockUser.avatar,
        isAdmin: mockUser.isAdmin,
        token: new TokenResponse('accessToken', 'refreshToken'),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest
        .spyOn(userService, 'findByEmail')
        .mockRejectedValue(new NotFoundException({ code: ERROR_CODE.ENTITY_NOT_FOUND }));

      await expect(service.auth(authRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('loginGoogle', () => {
    it('should login with Google successfully', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');
      jest.spyOn(refreshTokenRepository, 'save').mockResolvedValue(mockRefreshToken);

      const result = await service.loginGoogle('test@example.com');

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        avatar: mockUser.avatar,
        token: new TokenResponse('accessToken', 'refreshToken'),
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      jest
        .spyOn(userService, 'findByEmail')
        .mockRejectedValue(new BadRequestException({ code: ERROR_CODE.USER_NOT_FOUND }));

      await expect(service.loginGoogle('nonexistent@example.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refresh', () => {
    const tokenRequest: TokenRequest = { refreshToken: 'refreshToken' };

    it('should refresh token successfully', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: mockUser.id, isRefresh: true });
      jest.spyOn(refreshTokenRepository, 'findOneBy').mockResolvedValue(mockRefreshToken);
      jest
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce('newAccessToken')
        .mockReturnValueOnce('newRefreshToken');
      jest
        .spyOn(refreshTokenRepository, 'save')
        .mockResolvedValue({ ...mockRefreshToken, token: 'newRefreshToken' });
      jest.spyOn(refreshTokenRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      const result = await service.refresh(tokenRequest);

      expect(result).toEqual(new TokenResponse('newAccessToken', 'newRefreshToken'));
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error();
      });

      await expect(service.refresh(tokenRequest)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const tokenRequest: TokenRequest = { refreshToken: 'refreshToken' };

    it('should logout user successfully', async () => {
      jest.spyOn(refreshTokenRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.logout(tokenRequest);

      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        token: tokenRequest.refreshToken,
      });
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordRequest: ForgotPasswordRequest = { email: 'test@example.com' };

    it('should send forgot password OTP successfully', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(otpService, 'generateOtp').mockResolvedValue('123456');
      jest.spyOn(emailService, 'sendOtpEmail').mockResolvedValue(undefined);

      const result = await service.forgotPassword(forgotPasswordRequest);

      expect(result).toBeInstanceOf(OTPResponse);
      expect(otpService.generateOtp).toHaveBeenCalledWith(
        forgotPasswordRequest.email,
        OTP_PURPOSE.FORGOT_PASSWORD,
      );
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        forgotPasswordRequest.email,
        '123456',
        OTP_PURPOSE.FORGOT_PASSWORD,
      );
    });
  });

  describe('resetPassword', () => {
    const resetPasswordRequest: ResetPasswordRequest = {
      email: 'test@example.com',
      otp: '123456',
      newPassword: 'newPassword123',
    };

    it('should reset password successfully', async () => {
      await service.resetPassword(resetPasswordRequest);

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        resetPasswordRequest.email,
        resetPasswordRequest.otp,
        OTP_PURPOSE.FORGOT_PASSWORD,
      );
      expect(emailService.sendPasswordResetConfirmation).toHaveBeenCalledWith(
        resetPasswordRequest.email,
      );
    });
  });

  describe('resendOtp', () => {
    it('should resend OTP successfully', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(otpService, 'generateOtp').mockResolvedValue('123456');
      jest.spyOn(emailService, 'sendOtpEmail').mockResolvedValue(undefined);

      const result = await service.resendOtp('test@example.com');

      expect(result).toBeInstanceOf(OTPResponse);
    });
  });

  describe('sendRegisterOtp', () => {
    const registerRequest: RegisterRequest = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('should send register OTP successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(otpService, 'generateOtp').mockResolvedValue('123456');
      jest.spyOn(emailService, 'sendOtpEmail').mockResolvedValue(undefined);

      const result = await service.sendRegisterOtp(registerRequest);

      expect(result).toBeInstanceOf(OTPResponse);
    });

    it('should throw BadRequestException if email already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.sendRegisterOtp(registerRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerWithOtp', () => {
    const registerWithOtpRequest: RegisterWithOtpRequest = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      otp: '123456',
    };

    it('should register user with OTP successfully', async () => {
      jest.spyOn(otpService, 'verifyOtp').mockResolvedValue(true);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      await service.registerWithOtp(registerWithOtpRequest);

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        registerWithOtpRequest.email,
        registerWithOtpRequest.otp,
        OTP_PURPOSE.REGISTRATION,
      );
    });
  });

  describe('resendRegisterOtp', () => {
    it('should resend register OTP successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(otpService, 'generateOtp').mockResolvedValue('123456');
      jest.spyOn(emailService, 'sendOtpEmail').mockResolvedValue(undefined);

      const result = await service.resendRegisterOtp('newuser@example.com');

      expect(result).toBeInstanceOf(OTPResponse);
    });
  });

  describe('socialLogin', () => {
    const socialLoginRequest: SocialLoginRequest = { provider: 'google', accessToken: 'token' };

    it('should perform social login successfully', async () => {
      const socialUser = { id: 'social-1', email: 'social@example.com', name: 'Social User' };
      jest.spyOn(socialAuthService, 'verifySocialToken').mockResolvedValue(socialUser);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      jest
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');
      jest.spyOn(refreshTokenRepository, 'save').mockResolvedValue(mockRefreshToken);

      const result = await service.socialLogin(socialLoginRequest);

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        avatar: mockUser.avatar,
        isAdmin: mockUser.isAdmin,
        token: new TokenResponse('accessToken', 'refreshToken'),
      });
    });
  });

  describe('validateGoogleUser', () => {
    it('should validate Google user successfully', async () => {
      const googleUserDto = {
        name: 'Google User',
        email: 'google@example.com',
        isAdmin: false,
      };
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(googleUserDto);

      expect(result).toEqual(mockUser);
    });

    it('should create new user if not found', async () => {
      const googleUserDto = {
        name: 'New Google User',
        email: 'newgoogle@example.com',
        isAdmin: false,
      };
      jest.spyOn(userService, 'findByEmail').mockRejectedValue(new NotFoundException());
      jest.spyOn(userService, 'create').mockResolvedValue({
        ...mockUser,
        name: 'New Google User',
        email: 'newgoogle@example.com',
      });

      const result = await service.validateGoogleUser(googleUserDto);

      expect(userService.create).toHaveBeenCalledWith(googleUserDto);
    });
  });
});
