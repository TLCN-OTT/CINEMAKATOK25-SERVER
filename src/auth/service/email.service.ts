import * as nodemailer from 'nodemailer';

import * as config from 'config';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter;
  private readonly emailConfig = config.get<any>('email');

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      secure: this.emailConfig.secure,
      auth: {
        user: this.emailConfig.user,
        pass: this.emailConfig.pass,
      },
    });
  }

  private renderOtpEmail(subject: string, otp: string, purpose: string): string {
    let content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${this.emailConfig.fromName}</h1>
        </div>
        <div style="padding: 30px; color: #333;">
          <h2 style="margin-top: 0;">${subject}</h2>
          <p>Hello,</p>`;

    if (purpose === 'CHANGE_EMAIL') {
      content += `
          <p><strong>Someone is trying to change the email address for your account.</strong></p>
          <p>If this was you, please use the OTP code below to verify and complete the email change:</p>`;
    } else {
      content += `
          <p>Your OTP code is:</p>`;
    }

    content += `
          <div style="font-size: 24px; font-weight: bold; color: #4f46e5; margin: 20px 0; text-align: center;">
            ${otp}
          </div>
          <p>Purpose: <b>${purpose}</b></p>
          <p><i>Your OTP code will expire in <b>5 minutes</b>.</i></p>`;

    if (purpose === 'CHANGE_EMAIL') {
      content += `
          <p style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
            <strong>⚠️ Security Notice:</strong> If you did not request this email change, please ignore this email and consider changing your password immediately.
          </p>`;
    }

    content += `
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `;

    return content;
  }

  private renderPasswordResetSuccess(subject: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${this.emailConfig.fromName}</h1>
        </div>
        <div style="padding: 30px; color: #333;">
          <h2 style="margin-top: 0;">${subject}</h2>
          <p>Your password has been successfully changed.</p>
          <p>If you did not request this, please contact support immediately.</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>If you did not request this, please check your account.</p>
        </div>
      </div>
    `;
  }

  async sendOtpEmail(email: string, otp: string, purpose: string): Promise<void> {
    try {
      const subject = this.getEmailSubject(purpose);
      const htmlContent = this.renderOtpEmail(subject, otp, purpose);

      await this.transporter.sendMail({
        from: `"${this.emailConfig.fromName}" <${this.emailConfig.user}>`,
        to: email,
        subject,
        html: htmlContent,
      });

      this.logger.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendPasswordResetConfirmation(email: string): Promise<void> {
    try {
      const subject = 'Password Reset Confirmation';
      const htmlContent = this.renderPasswordResetSuccess(subject);

      await this.transporter.sendMail({
        from: `"${this.emailConfig.fromName}" <${this.emailConfig.user}>`,
        to: email,
        subject,
        html: htmlContent,
      });

      this.logger.log(`Password reset confirmation sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send confirmation email to ${email}`, error);
      throw new Error('Failed to send confirmation email');
    }
  }

  private getEmailSubject(purpose: string): string {
    switch (purpose) {
      case 'FORGOT_PASSWORD':
        return 'Reset Your Password - OTP Code';
      case 'EMAIL_VERIFICATION':
        return 'Verify Your Email Address';
      case 'TWO_FACTOR_AUTH':
        return 'Two-Factor Authentication Code';
      case 'REGISTRATION':
        return 'Complete Your Registration - OTP Code';
      case 'CHANGE_EMAIL':
        return 'Email Change Verification - OTP Code';
      default:
        return 'Verification Code';
    }
  }
}
