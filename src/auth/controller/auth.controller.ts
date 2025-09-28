import path from 'path';

import { GoogleAuthGuard } from '@app/common/guards/google-auth.guard';
import { ApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthRequest, TokenRequest, TokenResponse } from '../dtos/auth.dto';
import { AuthService } from '../service/auth.service';
import { UserService } from '../service/user.service';

@Controller({
  path: 'auth',
  version: '1',
})
@ApiTags('gsa / Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('/login')
  @HttpCode(200)
  @ApiBody({ type: AuthRequest })
  @ApiOkResponse({ description: 'Login success', type: ApiResponseDto(TokenResponse) })
  async login(@Body() authRequest: AuthRequest) {
    return ResponseBuilder.createResponse({ data: await this.authService.auth(authRequest) });
  }

  @Post('/refresh')
  @ApiBody({ type: TokenRequest })
  @HttpCode(200)
  @ApiOkResponse({ description: 'Refresh token success', type: ApiResponseDto(TokenResponse) })
  async refresh(@Body() token: TokenRequest) {
    return ResponseBuilder.createResponse({
      data: await this.authService.refresh(token),
    });
  }
  @Post('/logout')
  @ApiBody({ type: TokenRequest })
  @HttpCode(200)
  @ApiOkResponse({ description: 'Logout success' })
  async logout(@Body() token: TokenRequest) {
    await this.authService.logout(token);
    return ResponseBuilder.createResponse({
      data: null,
    });
  }
  @UseGuards(GoogleAuthGuard)
  @Get('/google/login')
  googleLogin() {}

  @UseGuards(GoogleAuthGuard)
  @Get('/google/callback')
  async googleCallback(@Req() req, @Res() res) {
    const response = await this.authService.loginGoogle(req.user.email);
    // res.redirect(`http://localhost:5173?token=${response.accessToken}`);
    return ResponseBuilder.createResponse({ data: response });
  }
}
