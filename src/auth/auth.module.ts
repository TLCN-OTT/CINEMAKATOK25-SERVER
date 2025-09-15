import * as config from 'config';

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from './controller/user.controller';
import { EntityRefreshToken } from './entities/refreshtoken.entity';
import { EntityUser } from './entities/user.entity';
import { UserService } from './service/user.service';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntityUser, EntityRefreshToken]),
    PassportModule,
    JwtModule.register({
      privateKey: config.get('jwt.privateKey'),
      publicKey: config.get('jwt.publicKey'),
      signOptions: {
        expiresIn: config.get('jwt.expiresTime'),
        algorithm: 'RS256',
      },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy],
  exports: [TypeOrmModule],
})
export class AuthModule {}
