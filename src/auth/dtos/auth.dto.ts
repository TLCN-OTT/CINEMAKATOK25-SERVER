import { Expose } from 'class-transformer/types/decorators/expose.decorator';
import { IsEmail, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AuthRequest {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  @Expose()
  password: string;
}

export class TokenResponse {
  @ApiProperty({
    description: 'Access token',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token',
  })
  @Expose()
  refreshToken: string;

  constructor(a_token: string, r_token: string) {
    this.accessToken = a_token;
    this.refreshToken = r_token;
  }
}

export class TokenRequest {
  @ApiProperty({
    description: 'jwt token',
  })
  @IsString()
  @Expose()
  refreshToken: string;
}
