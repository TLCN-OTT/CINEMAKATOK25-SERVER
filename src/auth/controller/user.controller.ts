import { plainToInstance } from 'class-transformer';

import { IsAdmin } from '@app/common/decorators/admin-role.decorator';
import { UserSession } from '@app/common/decorators/userSession.decorator';
import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { ApiResponseDto, PaginatedApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import '../dtos/profile.dto';
import {
  ChangePasswordRequest,
  ProfileResponse,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  UploadAvatarResponse,
} from '../dtos/profile.dto';
import {
  BanUserDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserInfoDto,
  UserDetailDto,
  UserDto,
  mapToUserDto,
} from '../dtos/user.dto';
import { ProfileService } from '../service/profile.service';
import { UserService } from '../service/user.service';

@Controller({
  path: 'users',
  version: '1',
})
@ApiBearerAuth()
@ApiTags('gsa / User')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) {}

  // Profile management endpoints (User-accessible)
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get the current user profile information',
  })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    type: ProfileResponse,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  async getProfile(@UserSession('id') userId: string) {
    const result = await this.profileService.getProfile(userId);
    return ResponseBuilder.createResponse({ data: plainToInstance(UserDto, result) });
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update user basic information (name, gender, date of birth, address, phone)',
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: ProfileResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input - Check the error message for details',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  async updateProfile(
    @UserSession('id') userId: string,
    @Body() updateProfileDto: UpdateProfileRequest,
  ) {
    const result = await this.profileService.updateProfile(userId, updateProfileDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(ProfileResponse, result, { excludeExtraneousValues: true }),
      message: 'Profile updated successfully',
    });
  }

  @Post('profile/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the current user password',
  })
  @ApiOkResponse({
    description: 'Password changed successfully',
    type: ProfileResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid current password or passwords do not match',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  async changePassword(
    @UserSession('id') userId: string,
    @Body() changePasswordDto: ChangePasswordRequest,
  ) {
    const result = await this.profileService.changePassword(userId, changePasswordDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(UserDto, result, { excludeExtraneousValues: true }),
      message: 'Password changed successfully',
    });
  }

  @Put('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update avatar',
    description: 'Update avatar with a new URL for the current user',
  })
  @ApiBody({ type: UpdateAvatarRequest })
  @ApiOkResponse({
    description: 'Avatar updated successfully',
    type: UploadAvatarResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid avatar URL',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  async updateAvatar(
    @UserSession('id') userId: string,
    @Body() updateAvatarDto: UpdateAvatarRequest,
  ) {
    const result = await this.profileService.updateAvatar(userId, updateAvatarDto.avatarUrl);
    return ResponseBuilder.createResponse({
      data: new UploadAvatarResponse(result),
      message: 'Avatar updated successfully',
    });
  }

  @Delete('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Delete avatar',
    description: 'Delete the current user avatar',
  })
  @ApiOkResponse({
    description: 'Avatar deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Avatar deleted successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'No avatar to delete',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  async deleteAvatar(@UserSession('id') userId: string) {
    await this.profileService.deleteAvatar(userId);
    return ResponseBuilder.createResponse({ data: null, message: 'Avatar deleted successfully' });
  }

  // Admin-only user management endpoints
  @Get()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @IsAdmin()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiOkResponse({ description: 'List of users', type: PaginatedApiResponseDto(UserDto) })
  @ApiQuery({
    name: 'page',
    required: false,
    default: 1,
    description: 'Page number for pagination',
    type: PaginationQueryDto['page'],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    default: 10,
    description: 'Limit number of users per page',
    type: PaginationQueryDto['limit'],
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order for users',
    type: PaginationQueryDto['sort'],
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    default: 1,
    description: 'Search term for users',
    type: 'string',
    example: 'user01',
  })
  async findAll(@Query() query: PaginationQueryDto, @Query('search') search?: string) {
    const { data, total } = await this.userService.findAll(query, search);
    return ResponseBuilder.createPaginatedResponse({
      data: data.map(user => plainToInstance(UserDto, user, { excludeExtraneousValues: true })),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Users retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiOkResponse({ description: 'User details', type: ApiResponseDto(UserDto) })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    // return this.userService.findOne(id);
    const result = await this.userService.findById(id);
    return ResponseBuilder.createResponse({ data: result });
  }
  @Post()
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
    type: ApiResponseDto(UserDto),
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const result = await this.userService.create(createUserDto);
    return ResponseBuilder.createResponse({ data: mapToUserDto(result) });
  }

  @Put(':id')
  @ApiOkResponse({ description: 'User updated successfully', type: ApiResponseDto(UserDto) })
  @ApiBody({ type: UpdateUserDto })
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateUserDto: UpdateUserDto) {
    const result = await this.userService.update(id, updateUserDto);
    return ResponseBuilder.createResponse({ data: mapToUserDto(result) });
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'User deleted successfully' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.userService.delete(id);
    return ResponseBuilder.createResponse({ data: null });
  }

  // Admin user management endpoints
  @Get(':id/detail')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @IsAdmin()
  @ApiOperation({ summary: 'Get user detail (Admin only)' })
  @ApiOkResponse({ description: 'User detail', type: ApiResponseDto(UserDetailDto) })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  async getUserDetail(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.userService.getUserDetail(id);
    return ResponseBuilder.createResponse({
      data: plainToInstance(UserDetailDto, result, { excludeExtraneousValues: true }),
      message: 'User detail retrieved successfully',
    });
  }

  @Post(':id/ban')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @IsAdmin()
  @ApiOperation({ summary: 'Ban user (Admin only)' })
  @ApiOkResponse({ description: 'User banned successfully', type: ApiResponseDto(UserDetailDto) })
  @ApiBody({ type: BanUserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  async banUser(@Param('id', new ParseUUIDPipe()) id: string, @Body() banUserDto: BanUserDto) {
    const result = await this.userService.banUser(id, banUserDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(UserDetailDto, result, { excludeExtraneousValues: true }),
      message: 'User banned successfully',
    });
  }

  @Delete(':id/unban')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @IsAdmin()
  @ApiOperation({ summary: 'Unban user (Admin only)' })
  @ApiOkResponse({ description: 'User unbanned successfully', type: ApiResponseDto(UserDetailDto) })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  async unbanUser(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.userService.unbanUser(id);
    return ResponseBuilder.createResponse({
      data: plainToInstance(UserDetailDto, result, { excludeExtraneousValues: true }),
      message: 'User unbanned successfully',
    });
  }

  @Put(':id/info')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @IsAdmin()
  @ApiOperation({ summary: 'Update user info (Admin only)' })
  @ApiOkResponse({
    description: 'User info updated successfully',
    type: ApiResponseDto(UserDetailDto),
  })
  @ApiBody({ type: UpdateUserInfoDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  async updateUserInfo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserInfoDto: UpdateUserInfoDto,
  ) {
    const result = await this.userService.updateUserInfo(id, updateUserInfoDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(UserDetailDto, result, { excludeExtraneousValues: true }),
      message: 'User info updated successfully',
    });
  }
}
