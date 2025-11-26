import { Repository, UpdateResult } from 'typeorm';
import { MoreThan } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { OTP_PURPOSE } from '@app/common/enums/global.enum';
import { OTPHash } from '@app/common/utils/hash';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EntityUserOtp } from '../../entities/otp.entity';
import { OtpService } from '../otp.service';

describe('OtpService', () => {
  let service: OtpService;
  let otpRepository: Repository<EntityUserOtp>;

  const mockOtpEntity = {
    id: 'otp-1',
    email: 'test@example.com',
    otp: 'hashedOtp',
    purpose: OTP_PURPOSE.FORGOT_PASSWORD,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    isUsed: false,
    attemptCount: 0,
  } as EntityUserOtp;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getRepositoryToken(EntityUserOtp),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              delete: jest.fn().mockReturnThis(),
              execute: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    otpRepository = module.get<Repository<EntityUserOtp>>(getRepositoryToken(EntityUserOtp));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate and save OTP successfully', async () => {
      const mockOtp = '123456';
      jest.spyOn(service as any, 'generateRandomOtp').mockReturnValue(mockOtp);
      jest.spyOn(OTPHash, 'hashOtp').mockReturnValue('hashedOtp');
      jest.spyOn(otpRepository, 'create').mockReturnValue(mockOtpEntity);
      jest.spyOn(otpRepository, 'save').mockResolvedValue(mockOtpEntity);

      // Mock invalidateExistingOtps to avoid actual call
      jest.spyOn(service as any, 'invalidateExistingOtps').mockResolvedValue(undefined);

      const result = await service.generateOtp('test@example.com', OTP_PURPOSE.FORGOT_PASSWORD);

      expect(result).toBe(mockOtp);
      expect(service['invalidateExistingOtps']).toHaveBeenCalledWith(
        'test@example.com',
        OTP_PURPOSE.FORGOT_PASSWORD,
      );
      expect(otpRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: 'hashedOtp',
        purpose: OTP_PURPOSE.FORGOT_PASSWORD,
        expiresAt: expect.any(Date),
        isUsed: false,
        attemptCount: 0,
      });
      expect(otpRepository.save).toHaveBeenCalledWith(mockOtpEntity);
    });

    it('should invalidate existing OTPs before generating new one', async () => {
      const mockOtp = '123456';
      jest.spyOn(service as any, 'generateRandomOtp').mockReturnValue(mockOtp);
      jest.spyOn(OTPHash, 'hashOtp').mockReturnValue('hashedOtp');
      jest.spyOn(otpRepository, 'create').mockReturnValue(mockOtpEntity);
      jest.spyOn(otpRepository, 'save').mockResolvedValue(mockOtpEntity);
      jest.spyOn(service as any, 'invalidateExistingOtps').mockResolvedValue(undefined);

      await service.generateOtp('test@example.com', OTP_PURPOSE.FORGOT_PASSWORD);

      expect(service['invalidateExistingOtps']).toHaveBeenCalledWith(
        'test@example.com',
        OTP_PURPOSE.FORGOT_PASSWORD,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const otpEntities = [mockOtpEntity];
      jest.spyOn(otpRepository, 'find').mockResolvedValue(otpEntities);
      jest.spyOn(OTPHash, 'compareOtp').mockReturnValue(true);
      jest.spyOn(otpRepository, 'save').mockResolvedValue({ ...mockOtpEntity, isUsed: true });

      const result = await service.verifyOtp(
        'test@example.com',
        '123456',
        OTP_PURPOSE.FORGOT_PASSWORD,
      );

      expect(result).toBe(true);
      expect(otpRepository.save).toHaveBeenCalledWith({ ...mockOtpEntity, isUsed: true });
    });

    it('should throw BadRequestException if OTP not found or invalid', async () => {
      jest.spyOn(otpRepository, 'find').mockResolvedValue([]);

      await expect(
        service.verifyOtp('test@example.com', '123456', OTP_PURPOSE.FORGOT_PASSWORD),
      ).rejects.toThrow(BadRequestException);

      expect(otpRepository.find).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          purpose: OTP_PURPOSE.FORGOT_PASSWORD,
          isUsed: false,
          expiresAt: MoreThan(expect.any(Date)),
        },
      });
    });

    it('should increment attempt count when OTP verification fails', async () => {
      const otpEntities = [mockOtpEntity];
      jest.spyOn(otpRepository, 'find').mockResolvedValue(otpEntities);
      jest.spyOn(OTPHash, 'compareOtp').mockReturnValue(false);
      jest.spyOn(service as any, 'incrementAttemptCount').mockResolvedValue(undefined);

      await expect(
        service.verifyOtp('test@example.com', 'wrongOtp', OTP_PURPOSE.FORGOT_PASSWORD),
      ).rejects.toThrow(BadRequestException);

      expect(service['incrementAttemptCount']).toHaveBeenCalledWith(
        'test@example.com',
        OTP_PURPOSE.FORGOT_PASSWORD,
      );
    });

    it('should throw BadRequestException if max attempts exceeded', async () => {
      const otpEntityWithMaxAttempts = { ...mockOtpEntity, attemptCount: 5 };
      const otpEntities = [otpEntityWithMaxAttempts];
      jest.spyOn(otpRepository, 'find').mockResolvedValue(otpEntities);
      jest.spyOn(OTPHash, 'compareOtp').mockReturnValue(true);
      jest.spyOn(service as any, 'invalidateOtp').mockResolvedValue(undefined);

      await expect(
        service.verifyOtp('test@example.com', '123456', OTP_PURPOSE.FORGOT_PASSWORD),
      ).rejects.toThrow(BadRequestException);

      expect(service['invalidateOtp']).toHaveBeenCalledWith(mockOtpEntity.id);
    });
  });

  describe('isOtpValid', () => {
    it('should return true if OTP is valid', async () => {
      const otpEntities = [mockOtpEntity];
      jest.spyOn(otpRepository, 'find').mockResolvedValue(otpEntities);
      jest.spyOn(OTPHash, 'compareOtp').mockReturnValue(true);

      const result = await service.isOtpValid(
        'test@example.com',
        '123456',
        OTP_PURPOSE.FORGOT_PASSWORD,
      );

      expect(result).toBe(true);
    });

    it('should return false if OTP is invalid', async () => {
      const otpEntities = [mockOtpEntity];
      jest.spyOn(otpRepository, 'find').mockResolvedValue(otpEntities);
      jest.spyOn(OTPHash, 'compareOtp').mockReturnValue(false);

      const result = await service.isOtpValid(
        'test@example.com',
        'wrongOtp',
        OTP_PURPOSE.FORGOT_PASSWORD,
      );

      expect(result).toBe(false);
    });

    it('should return false if attempt count exceeds max', async () => {
      const otpEntityWithMaxAttempts = { ...mockOtpEntity, attemptCount: 6 };
      const otpEntities = [otpEntityWithMaxAttempts];
      jest.spyOn(otpRepository, 'find').mockResolvedValue(otpEntities);

      const result = await service.isOtpValid(
        'test@example.com',
        '123456',
        OTP_PURPOSE.FORGOT_PASSWORD,
      );

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredOtps', () => {
    it('should delete expired OTPs successfully', async () => {
      const queryBuilderMock = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };
      jest.spyOn(otpRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);

      await service.cleanupExpiredOtps();

      expect(queryBuilderMock.delete).toHaveBeenCalled();
      expect(queryBuilderMock.where).toHaveBeenCalledWith('expiresAt < :now', {
        now: expect.any(Date),
      });
      expect(queryBuilderMock.execute).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredOtpsByEmail', () => {
    it('should delete expired OTPs for specific email successfully', async () => {
      const queryBuilderMock = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      };
      jest.spyOn(otpRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);

      await service.cleanupExpiredOtpsByEmail('test@example.com');

      expect(queryBuilderMock.delete).toHaveBeenCalled();
      expect(queryBuilderMock.where).toHaveBeenCalledWith('email = :email AND expiresAt < :now', {
        email: 'test@example.com',
        now: expect.any(Date),
      });
      expect(queryBuilderMock.execute).toHaveBeenCalled();
    });
  });

  describe('private methods', () => {
    describe('generateRandomOtp', () => {
      it('should generate a 6-digit OTP', () => {
        const result = (service as any).generateRandomOtp();

        expect(result).toMatch(/^\d{6}$/);
        expect(parseInt(result)).toBeGreaterThanOrEqual(100000);
        expect(parseInt(result)).toBeLessThanOrEqual(999999);
      });
    });

    describe('invalidateExistingOtps', () => {
      it('should invalidate existing OTPs', async () => {
        jest.spyOn(otpRepository, 'update').mockResolvedValue({ affected: 1 } as UpdateResult);

        await (service as any).invalidateExistingOtps(
          'test@example.com',
          OTP_PURPOSE.FORGOT_PASSWORD,
        );

        expect(otpRepository.update).toHaveBeenCalledWith(
          { email: 'test@example.com', purpose: OTP_PURPOSE.FORGOT_PASSWORD, isUsed: false },
          { isUsed: true },
        );
      });
    });

    describe('invalidateOtp', () => {
      it('should invalidate specific OTP', async () => {
        jest.spyOn(otpRepository, 'update').mockResolvedValue({ affected: 1 } as UpdateResult);

        await (service as any).invalidateOtp('otp-1');

        expect(otpRepository.update).toHaveBeenCalledWith('otp-1', { isUsed: true });
      });
    });

    describe('incrementAttemptCount', () => {
      it('should increment attempt count for active OTPs', async () => {
        const queryBuilderMock = {
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue(undefined),
        };
        jest.spyOn(otpRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);

        await (service as any).incrementAttemptCount(
          'test@example.com',
          OTP_PURPOSE.FORGOT_PASSWORD,
        );

        expect(queryBuilderMock.update).toHaveBeenCalledWith(EntityUserOtp);
        expect(queryBuilderMock.set).toHaveBeenCalledWith({ attemptCount: expect.any(Function) });
        expect(queryBuilderMock.where).toHaveBeenCalledWith(
          'email = :email AND purpose = :purpose AND isUsed = false',
          { email: 'test@example.com', purpose: OTP_PURPOSE.FORGOT_PASSWORD },
        );
        expect(queryBuilderMock.execute).toHaveBeenCalled();
      });
    });
  });
});
