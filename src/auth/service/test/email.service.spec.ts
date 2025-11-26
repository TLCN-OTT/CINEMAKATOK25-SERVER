import * as nodemailer from 'nodemailer';

import { OTP_PURPOSE } from '@app/common/enums/global.enum';
import { Test, TestingModule } from '@nestjs/testing';

import { EmailService } from '../email.service';

// Mock config before any imports
jest.mock('config', () => ({
  get: jest.fn((key: string) => {
    const mockConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: 'your_email@gmail.com',
      pass: 'password',
      fromName: 'Test App',
    };
    if (key === 'email') {
      return mockConfig;
    }
    return {};
  }),
}));

describe('EmailService', () => {
  let service: EmailService;
  let transporterMock: any;

  beforeEach(async () => {
    // Mock nodemailer
    transporterMock = {
      sendMail: jest.fn(),
    };

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue(transporterMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtpEmail', () => {
    it('should send OTP email successfully for FORGOT_PASSWORD', async () => {
      transporterMock.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendOtpEmail('test@example.com', '123456', OTP_PURPOSE.FORGOT_PASSWORD);

      expect(transporterMock.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <your_email@gmail.com>',
        to: 'test@example.com',
        subject: 'Reset Your Password - OTP Code',
        html: expect.stringContaining('123456'),
      });
    });

    it('should send OTP email successfully for EMAIL_VERIFICATION', async () => {
      transporterMock.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendOtpEmail('test@example.com', '123456', OTP_PURPOSE.EMAIL_VERIFICATION);

      expect(transporterMock.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <your_email@gmail.com>',
        to: 'test@example.com',
        subject: 'Verify Your Email Address',
        html: expect.stringContaining('123456'),
      });
    });

    it('should send OTP email successfully for REGISTRATION', async () => {
      transporterMock.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendOtpEmail('test@example.com', '123456', OTP_PURPOSE.REGISTRATION);

      expect(transporterMock.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <your_email@gmail.com>',
        to: 'test@example.com',
        subject: 'Complete Your Registration - OTP Code',
        html: expect.stringContaining('123456'),
      });
    });

    it('should send OTP email successfully for CHANGE_EMAIL', async () => {
      transporterMock.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendOtpEmail('test@example.com', '123456', OTP_PURPOSE.CHANGE_EMAIL);

      expect(transporterMock.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <your_email@gmail.com>',
        to: 'test@example.com',
        subject: 'Email Change Verification - OTP Code',
        html: expect.stringContaining('123456'),
      });
    });

    it('should send OTP email successfully for TWO_FACTOR_AUTH', async () => {
      transporterMock.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendOtpEmail('test@example.com', '123456', OTP_PURPOSE.TWO_FACTOR_AUTH);

      expect(transporterMock.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <your_email@gmail.com>',
        to: 'test@example.com',
        subject: 'Two-Factor Authentication Code',
        html: expect.stringContaining('123456'),
      });
    });

    it('should send OTP email successfully for default purpose', async () => {
      transporterMock.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendOtpEmail('test@example.com', '123456', 'UNKNOWN_PURPOSE' as any);

      expect(transporterMock.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <your_email@gmail.com>',
        to: 'test@example.com',
        subject: 'Verification Code',
        html: expect.stringContaining('123456'),
      });
    });

    it('should throw error if email sending fails', async () => {
      transporterMock.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(
        service.sendOtpEmail('test@example.com', '123456', OTP_PURPOSE.FORGOT_PASSWORD),
      ).rejects.toThrow('Failed to send OTP email');
    });
  });

  describe('sendPasswordResetConfirmation', () => {
    it('should send password reset confirmation successfully', async () => {
      transporterMock.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendPasswordResetConfirmation('test@example.com');

      expect(transporterMock.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <your_email@gmail.com>',
        to: 'test@example.com',
        subject: 'Password Reset Confirmation',
        html: expect.stringContaining('Your password has been successfully changed'),
      });
    });

    it('should throw error if email sending fails', async () => {
      transporterMock.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(service.sendPasswordResetConfirmation('test@example.com')).rejects.toThrow(
        'Failed to send confirmation email',
      );
    });
  });

  describe('sendUserBanNotification', () => {
    const banDetails = {
      email: 'test@example.com',
      userName: 'Test User',
      banReason: 'Violation of terms',
      bannedUntil: new Date('2024-12-31'),
    };

    it('should send user ban notification successfully', async () => {
      transporterMock.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendUserBanNotification(
        banDetails.email,
        banDetails.userName,
        banDetails.banReason,
        banDetails.bannedUntil,
      );

      expect(transporterMock.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <your_email@gmail.com>',
        to: banDetails.email,
        subject: 'Account Suspension Notification',
        html: expect.stringContaining('Account Suspension Notice'),
      });
    });

    it('should throw error if email sending fails', async () => {
      transporterMock.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(
        service.sendUserBanNotification(
          banDetails.email,
          banDetails.userName,
          banDetails.banReason,
          banDetails.bannedUntil,
        ),
      ).rejects.toThrow('Failed to send ban notification');
    });
  });

  describe('sendEmail', () => {
    it('should send generic email successfully', async () => {
      transporterMock.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendEmail('test@example.com', 'Test Subject', '<h1>Test</h1>');

      expect(transporterMock.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <your_email@gmail.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      });
    });

    it('should throw error if email sending fails', async () => {
      transporterMock.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(
        service.sendEmail('test@example.com', 'Test Subject', '<h1>Test</h1>'),
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('private methods', () => {
    describe('renderOtpEmail', () => {
      it('should render OTP email HTML correctly', () => {
        const result = (service as any).renderOtpEmail(
          'Test Subject',
          '123456',
          OTP_PURPOSE.FORGOT_PASSWORD,
        );

        expect(result).toContain('Test Subject');
        expect(result).toContain('123456');
        expect(result).toContain('Your OTP code is:');
        expect(result).toContain('5 minutes');
      });

      it('should render CHANGE_EMAIL purpose correctly', () => {
        const result = (service as any).renderOtpEmail(
          'Test Subject',
          '123456',
          OTP_PURPOSE.CHANGE_EMAIL,
        );

        expect(result).toContain('Someone is trying to change the email address');
        expect(result).toContain('Security Notice');
      });
    });

    describe('renderPasswordResetSuccess', () => {
      it('should render password reset success HTML correctly', () => {
        const result = (service as any).renderPasswordResetSuccess('Password Reset Success');

        expect(result).toContain('Password Reset Success');
        expect(result).toContain('Your password has been successfully changed');
        expect(result).toContain('If you did not request this');
      });
    });

    describe('renderUserBanNotification', () => {
      it('should render user ban notification HTML correctly', () => {
        const bannedUntil = new Date('2024-12-31');
        const result = (service as any).renderUserBanNotification(
          'Test User',
          'Violation',
          bannedUntil,
        );

        expect(result).toContain('Account Suspension Notice');
        expect(result).toContain('Test User');
        expect(result).toContain('Violation');
        expect(result).toContain('31/12/2024');
      });
    });

    describe('getEmailSubject', () => {
      it('should return correct subject for FORGOT_PASSWORD', () => {
        const result = (service as any).getEmailSubject(OTP_PURPOSE.FORGOT_PASSWORD);
        expect(result).toBe('Reset Your Password - OTP Code');
      });

      it('should return correct subject for EMAIL_VERIFICATION', () => {
        const result = (service as any).getEmailSubject(OTP_PURPOSE.EMAIL_VERIFICATION);
        expect(result).toBe('Verify Your Email Address');
      });

      it('should return correct subject for REGISTRATION', () => {
        const result = (service as any).getEmailSubject(OTP_PURPOSE.REGISTRATION);
        expect(result).toBe('Complete Your Registration - OTP Code');
      });

      it('should return correct subject for TWO_FACTOR_AUTH', () => {
        const result = (service as any).getEmailSubject(OTP_PURPOSE.TWO_FACTOR_AUTH);
        expect(result).toBe('Two-Factor Authentication Code');
      });

      it('should return default subject for unknown purpose', () => {
        const result = (service as any).getEmailSubject('UNKNOWN' as any);
        expect(result).toBe('Verification Code');
      });
    });
  });
});
