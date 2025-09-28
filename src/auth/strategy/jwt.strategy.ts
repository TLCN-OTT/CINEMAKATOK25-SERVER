import { get } from 'node_modules/axios/index.cjs';
import { ExtractJwt, Strategy } from 'passport-jwt';

import * as config from 'config';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { USER_STATUS } from '@app/common/enums/global.enum';
import { getConfig } from '@app/common/utils/get-config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import type { JwtPayload } from '../constants/jwt-payload';
import { mapToUserDto } from '../dtos/user.dto';
import { EntityUser } from '../entities/user.entity';
import { UserService } from '../service/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getConfig('jwt.publicKey', 'your_jwt_public_key'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.isRefresh) {
      throw new UnauthorizedException({ code: ERROR_CODE.INVALID_TOKEN });
    }
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({ code: ERROR_CODE.INVALID_TOKEN });
    }
    if ((user as EntityUser).status === USER_STATUS.DEACTIVATED) {
      throw new UnauthorizedException({ code: ERROR_CODE.ACCOUNT_DEACTIVATED });
    }
    return mapToUserDto(user as EntityUser);
  }
}
