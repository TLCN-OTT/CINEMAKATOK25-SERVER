import * as config from 'config';

import { CoreModule } from '@app/core';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './controller/auth.controller';
import { UserController } from './controller/user.controller';
import { EntityUserOtp } from './entities/otp.entity';
import { EntityRefreshToken } from './entities/refreshtoken.entity';
import { EntityUser } from './entities/user.entity';
import { AuthService } from './service/auth.service';
import { EmailService } from './service/email.service';
import { OtpService } from './service/otp.service';
import { ProfileService } from './service/profile.service';
import { SocialAuthService } from './service/social-auth.service';
import { UserService } from './service/user.service';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntityUser, EntityRefreshToken, EntityUserOtp]),
    PassportModule,
    CoreModule, // For AxiosService
    JwtModule.register({
      privateKey: config.get('jwt.privateKey'),
      publicKey: config.get('jwt.publicKey'),
      // privateKey: config.get<string>('jwt.privateKey').replace(/\\n/g, '\n'),
      // publicKey: config.get<string>('jwt.publicKey').replace(/\\n/g, '\n'),
      signOptions: {
        expiresIn: config.get('jwt.expiresTime'),
        algorithm: 'RS256',
      },
    }),
  ],
  controllers: [UserController, AuthController],
  providers: [
    UserService,
    AuthService,
    OtpService,
    EmailService,
    SocialAuthService,
    ProfileService,
    JwtStrategy,
  ],
  exports: [TypeOrmModule],
})
export class AuthModule {}
