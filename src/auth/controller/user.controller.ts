import { IsAdmin } from '@app/common/decorators/admin-role.decorator';
import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { ApiResponseDto, PaginatedApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUserDto, UpdateUserDto, UserDto, mapToUserDto } from '../dtos/user.dto';
import { UserService } from '../service/user.service';

@Controller({
  path: 'users',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, IsAdminGuard)
@IsAdmin()
@ApiTags('gsa / User')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
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
    // return this.userService.findAll(query, search);
    return null;
  }

  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiOkResponse({ description: 'User details', type: ApiResponseDto(UserDto) })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    // return this.userService.findOne(id);
    const result = await this.userService.findById(id);
    return ResponseBuilder.createResponse({ data: result });
  }

  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
    type: ApiResponseDto(UserDto),
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const result = await this.userService.create(createUserDto);
    return ResponseBuilder.createResponse({ data: mapToUserDto(result) });
  }

  @ApiOkResponse({ description: 'User updated successfully', type: ApiResponseDto(UserDto) })
  @ApiBody({ type: UpdateUserDto })
  @Put(':id')
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateUserDto: UpdateUserDto) {
    const result = await this.userService.update(id, updateUserDto);
    return ResponseBuilder.createResponse({ data: mapToUserDto(result) });
  }
  @ApiOkResponse({ description: 'User deleted successfully' })
  @Delete(':id')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.userService.delete(id);
    return ResponseBuilder.createResponse({ data: null });
  }
}
