import { get } from 'node_modules/axios/index.cjs';

import { getConfig } from '@app/common/utils/get-config/get-config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import googleOauthConfig from './config/google-oauth.config';
import { AuthController } from './controller/auth.controller';
import { UserController } from './controller/user.controller';
import { EntityRefreshToken } from './entities/refreshtoken.entity';
import { EntityUser } from './entities/user.entity';
import { AuthService } from './service/auth.service';
import { UserService } from './service/user.service';
import { GoogleStrategy } from './strategy/google.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntityUser, EntityRefreshToken]),
    PassportModule,
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
  providers: [UserService, JwtStrategy, GoogleStrategy, AuthService],
  exports: [TypeOrmModule],
})
export class AuthModule {}
