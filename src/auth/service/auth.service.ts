import * as config from 'config';
import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { getConfig } from '@app/common/utils/get-config';
import { PasswordHash } from '@app/common/utils/hash';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { JwtPayload } from '../constants/jwt-payload';
import { AuthRequest, TokenRequest, TokenResponse } from '../dtos/auth.dto';
import { CreateUserDto } from '../dtos/user.dto';
import { EntityRefreshToken } from '../entities/refreshtoken.entity';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  private readonly refreshExpiresTime = config.get('jwt.refreshExpiresTime'); // getConfig<string>('jwt.refreshExpiresIn', '1d')
  constructor(
    private readonly usersService: UserService,
    @InjectRepository(EntityRefreshToken)
    private readonly tokenRepository: Repository<EntityRefreshToken>,
    private readonly jwtService: JwtService,
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
