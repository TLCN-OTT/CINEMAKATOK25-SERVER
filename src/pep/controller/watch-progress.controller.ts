import { plainToInstance } from 'class-transformer';

import { UserSession } from '@app/common/decorators';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { ApiResponseDto } from '@app/common/utils/dto';
import { PaginatedApiResponseDto } from '@app/common/utils/dto/paginated-api-response.dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { ResponseBuilder } from '@app/common/utils/dto/response-builder';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  CreateWatchProgressDto,
  ResumeWatchDto,
  UpdateWatchProgressDto,
  WatchProgressDto,
} from '../dtos/watch-progress.dto';
import { WatchProgressService } from '../services/watch-progress.service';

@Controller('watch-progress')
@ApiTags('pep/Watch Progress')
@ApiBearerAuth()
export class WatchProgressController {
  constructor(private readonly watchProgressService: WatchProgressService) {}

  /**
   * Update watch progress (create or update)
   */
  @Post()
  @ApiOperation({ summary: 'Create or update watch progress for a content' })
  @ApiOkResponse({
    description: 'Watch progress updated successfully',
    type: ApiResponseDto(WatchProgressDto),
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  @UseGuards(JwtAuthGuard)
  async createOrUpdateWatchProgress(
    @UserSession('id') userId: string,
    @Body() createDto: CreateWatchProgressDto,
  ) {
    const watchProgress = await this.watchProgressService.updateWatchProgress(userId, createDto);
    return ResponseBuilder.createResponse({
      message: 'Watch progress updated successfully',
      data: plainToInstance(WatchProgressDto, watchProgress, { excludeExtraneousValues: true }),
    });
  }

  /**
   * Update specific watch progress
   */
  @Put(':contentId')
  @ApiOperation({ summary: 'Update watch progress for a specific content' })
  @ApiOkResponse({
    description: 'Watch progress updated successfully',
    type: ApiResponseDto(WatchProgressDto),
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  @ApiNotFoundResponse({ description: 'Watch progress not found' })
  @UseGuards(JwtAuthGuard)
  async updateProgress(
    @UserSession('id') userId: string,
    @Param('contentId') contentId: string,
    @Body() updateDto: UpdateWatchProgressDto,
  ) {
    const watchProgress = await this.watchProgressService.updateProgress(
      userId,
      contentId,
      updateDto,
    );
    return ResponseBuilder.createResponse({
      message: 'Watch progress updated successfully',
      data: plainToInstance(WatchProgressDto, watchProgress, { excludeExtraneousValues: true }),
    });
  }

  /**
   * Get resume data for a content
   */
  @Get('resume/:contentId')
  @ApiOperation({ summary: 'Get resume data to continue watching' })
  @ApiOkResponse({ description: 'Resume data retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Watch progress not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  @UseGuards(JwtAuthGuard)
  async getResumeData(@UserSession('id') userId: string, @Param('contentId') contentId: string) {
    const resumeData = await this.watchProgressService.getResumeData(userId, contentId);
    return ResponseBuilder.createResponse({
      message: 'Resume data retrieved successfully',
      data: resumeData,
    });
  }

  /**
   * Get watch progress for a specific content
   */
  @Get(':contentId')
  @ApiOperation({ summary: 'Get watch progress for a specific content' })
  @ApiOkResponse({ description: 'Watch progress retrieved successfully', type: WatchProgressDto })
  @ApiNotFoundResponse({ description: 'Watch progress not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  @UseGuards(JwtAuthGuard)
  async getWatchProgress(@UserSession('id') userId: string, @Param('contentId') contentId: string) {
    const watchProgress = await this.watchProgressService.getWatchProgress(userId, contentId);
    return ResponseBuilder.createResponse({
      message: 'Watch progress retrieved successfully',
      data: plainToInstance(WatchProgressDto, watchProgress, { excludeExtraneousValues: true }),
    });
  }

  /**
   * Get all watch progress by current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all watch progress for current user' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort order',
    example: '{ "lastWatched": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by content title',
  })
  @ApiQuery({
    name: 'isCompleted',
    required: false,
    type: Boolean,
    description: 'Filter by completion status',
  })
  @ApiOkResponse({
    description: 'List of watch progress',
    type: PaginatedApiResponseDto(WatchProgressDto),
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  @UseGuards(JwtAuthGuard)
  async getAllWatchProgress(
    @UserSession('id') userId: string,
    @Query() query: PaginationQueryDto & { search?: string; isCompleted?: boolean },
  ) {
    const { data, total } = await this.watchProgressService.getWatchProgressByUser(userId, query);
    const enrichedData = data.map((item: any) => ({
      ...plainToInstance(WatchProgressDto, item, { excludeExtraneousValues: true }),
      metadata: item.content
        ? {
            id: item.content.id,
            title: item.content.title,
            description: item.content.description,
            thumbnail: item.content.thumbnail,
            banner: item.content.banner,
            trailer: item.content.trailer,
            type: item.content.type,
            releaseDate: item.content.releaseDate,
            avgRating: item.content.avgRating,
            imdbRating: item.content.imdbRating,
            maturityRating: item.content.maturityRating,
            viewCount: item.content.viewCount,
          }
        : null,
      duration: item.duration || null,
    }));
    return ResponseBuilder.createPaginatedResponse({
      data: enrichedData,
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Watch progress retrieved successfully',
    });
  }

  /**
   * Get watch history
   */
  @Get('history')
  @ApiOperation({ summary: 'Get watch history' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiOkResponse({
    description: 'List of watch history',
    type: PaginatedApiResponseDto(WatchProgressDto),
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  @UseGuards(JwtAuthGuard)
  async getWatchHistory(@UserSession('id') userId: string, @Query() query: PaginationQueryDto) {
    const { data, total } = await this.watchProgressService.getWatchHistory(userId, query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(WatchProgressDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Watch history retrieved successfully',
    });
  }

  /**
   * Get recently watched contents (quick resume)
   */
  @Get('recently-watched')
  @ApiOperation({ summary: 'Get recently watched contents for quick resume' })
  @ApiOkResponse({
    description: 'List of recently watched contents',
    type: [WatchProgressDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  @UseGuards(JwtAuthGuard)
  async getRecentlyWatched(@UserSession('id') userId: string) {
    const recentlyWatched = await this.watchProgressService.getRecentlyWatched(userId, 10);
    return ResponseBuilder.createResponse({
      message: 'Recently watched contents retrieved successfully',
      data: plainToInstance(WatchProgressDto, recentlyWatched, {
        excludeExtraneousValues: true,
      }),
    });
  }

  /**
   * Mark content as completed
   */
  @Put(':contentId/complete')
  @ApiOperation({ summary: 'Mark content as completed' })
  @ApiOkResponse({
    description: 'Content marked as completed',
    type: ApiResponseDto(WatchProgressDto),
  })
  @ApiNotFoundResponse({ description: 'Watch progress not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  @UseGuards(JwtAuthGuard)
  async markAsCompleted(@UserSession('id') userId: string, @Param('contentId') contentId: string) {
    const watchProgress = await this.watchProgressService.markAsCompleted(userId, contentId);
    return ResponseBuilder.createResponse({
      message: 'Content marked as completed successfully',
      data: plainToInstance(WatchProgressDto, watchProgress, { excludeExtraneousValues: true }),
    });
  }

  /**
   * Delete watch progress
   */
  @Delete(':contentId')
  @ApiOperation({ summary: 'Delete watch progress for a content' })
  @ApiOkResponse({ description: 'Watch progress deleted successfully' })
  @ApiNotFoundResponse({ description: 'Watch progress not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing access token' })
  @UseGuards(JwtAuthGuard)
  async deleteWatchProgress(
    @UserSession('id') userId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.watchProgressService.deleteWatchProgress(userId, contentId);
  }
}
