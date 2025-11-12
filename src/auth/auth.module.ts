import { getConfig } from '@app/common/utils/get-config/get-config';
import { CoreModule } from '@app/core/index';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import googleOauthConfig from './config/google-oauth.config';
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
import { UserBanSchedulerService } from './service/user-ban-scheduler.service';
import { UserService } from './service/user.service';
import { GoogleStrategy } from './strategy/google.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntityUser, EntityRefreshToken, EntityUserOtp]),
    PassportModule,
    ScheduleModule.forRoot(),
    CoreModule, // For AxiosService
    JwtModule.register({
      privateKey: getConfig('jwt.privateKey', 'your_jwt_private_key'),
      publicKey: getConfig('jwt.publicKey', 'your_jwt_public_key'),
      signOptions: {
        expiresIn: getConfig('jwt.expiresTime', '5m'),
        algorithm: 'RS256',
      },
    }),
    ConfigModule.forFeature(googleOauthConfig),
  ],
  controllers: [UserController, AuthController],
  providers: [
    UserService,
    AuthService,
    OtpService,
    EmailService,
    SocialAuthService,
    ProfileService,
    UserBanSchedulerService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [TypeOrmModule],
})
export class AuthModule {}
