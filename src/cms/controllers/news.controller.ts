import { AuditLogService } from 'src/audit-log/service/audit-log.service';

import { plainToInstance } from 'class-transformer';

import { UserSession } from '@app/common/decorators/userSession.decorator';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import {
  ApiResponseDto,
  PaginatedApiResponse,
  PaginatedApiResponseDto,
} from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { ResponseBuilder } from '@app/common/utils/dto/response-builder';
import {
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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateNewsDto, NewsDto, UpdateNewsDto } from '../dtos/news.dto';
import { NewsService } from '../services/news.service';

@Controller('news')
@ApiTags('cms/News')
@ApiBearerAuth()
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create a new news' })
  @ApiResponse({
    status: 201,
    description: 'The news has been successfully created.',
    type: ApiResponseDto(NewsDto),
  })
  async create(@Body() createNewsDto: CreateNewsDto, @UserSession('id') userId: string) {
    const news = await this.newsService.create(createNewsDto, userId);
    await this.auditLogService.log({
      action: LOG_ACTION.CREATE_NEWS,
      userId: userId,
      description: `Created news with ID ${news.id} by admin ${userId}`,
    });

    return ResponseBuilder.createResponse({
      data: plainToInstance(NewsDto, news, { excludeExtraneousValues: true }),
      message: 'Content updated successfully',
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Update an existing news' })
  @ApiResponse({
    status: 200,
    description: 'The news has been successfully updated.',
    type: ApiResponseDto(NewsDto),
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateNewsDto: UpdateNewsDto,
    @UserSession('id') userId: string,
  ) {
    const news = await this.newsService.update(id, updateNewsDto);
    await this.auditLogService.log({
      action: LOG_ACTION.UPDATE_NEWS,
      userId: userId,
      description: `Updated news with ID ${news.id} by admin ${userId}`,
    });
    return ResponseBuilder.createResponse({
      data: plainToInstance(NewsDto, news, { excludeExtraneousValues: true }),
      message: 'Content updated successfully',
    });
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Delete a news' })
  @ApiResponse({
    status: 200,
    description: 'The news has been successfully deleted.',
    type: undefined,
  })
  async delete(@Param('id', new ParseUUIDPipe()) id: string, @UserSession('id') userId: string) {
    const news = await this.newsService.remove(id);
    await this.auditLogService.log({
      action: LOG_ACTION.DELETE_NEWS,
      userId: userId,
      description: `Deleted news with ID ${id} by admin ${userId}`,
    });
    return ResponseBuilder.createResponse({
      message: 'News deleted successfully',
      data: null,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiResponse({
    status: 200,
    description: 'The news has been successfully retrieved.',
    type: ApiResponseDto(NewsDto),
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const news = await this.newsService.findOne(id);
    return ResponseBuilder.createResponse({
      data: plainToInstance(NewsDto, news, { excludeExtraneousValues: true }),
      message: 'News retrieved successfully',
    });
  }
  @Get()
  @ApiOperation({ summary: 'Get all news' })
  @ApiResponse({
    status: 200,
    description: 'The news list has been successfully retrieved.',
    type: PaginatedApiResponseDto(NewsDto),
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: '{"createdAt":"DESC"}' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'breaking news' })
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.newsService.findAll(query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(NewsDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
    });
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related news by ID' })
  @ApiResponse({
    status: 200,
    description: 'The related news list has been successfully retrieved.',
    type: PaginatedApiResponseDto(NewsDto),
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: '{"createdAt":"DESC"}' })
  async findNewsRelated(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { data, total } = await this.newsService.findNewsRelated(id, query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(NewsDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Related news retrieved successfully',
    });
  }
}
