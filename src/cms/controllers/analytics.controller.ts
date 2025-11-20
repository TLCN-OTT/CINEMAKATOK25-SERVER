import { ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  PaginatedTrendingDataDto,
  PaginatedViewStatsDto,
  TrendingDataWithPaginationDto,
  UserStatsDto,
  ViewStatsDto,
} from '../dtos/analytics.dto';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('movies')
  @ApiOperation({ summary: 'Get paginated movie view statistics' })
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
    description: 'Sort order for movies',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search movies by title',
  })
  @ApiResponse({
    status: 200,
    description: 'Movie statistics retrieved successfully',
    type: PaginatedViewStatsDto,
  })
  async getMoviesStats(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.analyticsService.getMoviesStats(query);
    return ResponseBuilder.createPaginatedResponse({
      data,
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Movie statistics retrieved successfully',
    });
  }

  @Get('tvseries')
  @ApiOperation({ summary: 'Get paginated TV series view statistics' })
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
    description: 'Sort order for TV series',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search TV series by title',
  })
  @ApiResponse({
    status: 200,
    description: 'TV series statistics retrieved successfully',
    type: PaginatedViewStatsDto,
  })
  async getTVSeriesStats(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.analyticsService.getTVSeriesStats(query);
    return ResponseBuilder.createPaginatedResponse({
      data,
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'TV series statistics retrieved successfully',
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get paginated category view statistics' })
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
    description: 'Sort order for categories',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search categories by name',
  })
  @ApiResponse({
    status: 200,
    description: 'Category statistics retrieved successfully',
    type: PaginatedViewStatsDto,
  })
  async getCategoriesStats(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.analyticsService.getCategoriesStats(query);
    return ResponseBuilder.createPaginatedResponse({
      data,
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Category statistics retrieved successfully',
    });
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user statistics and metrics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    type: UserStatsDto,
  })
  async getUserStats() {
    const result = await this.analyticsService.getUserStats();
    return ResponseBuilder.createResponse({ data: result });
  }

  @Get('trending/movies')
  @ApiOperation({ summary: 'Get paginated trending movies data' })
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
    description: 'Sort order for trending movies',
    example: '{ "change": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search trending movies by title',
  })
  @ApiResponse({
    status: 200,
    description: 'Trending movies retrieved successfully',
    type: PaginatedTrendingDataDto,
  })
  async getTrendingMovies(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.analyticsService.getTrendingMovies(query);
    return ResponseBuilder.createPaginatedResponse({
      data,
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Trending movies retrieved successfully',
    });
  }

  @Get('trending/tvseries')
  @ApiOperation({ summary: 'Get paginated trending TV series data' })
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
    description: 'Sort order for trending TV series',
    example: '{ "change": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search trending TV series by title',
  })
  @ApiResponse({
    status: 200,
    description: 'Trending TV series retrieved successfully',
    type: PaginatedTrendingDataDto,
  })
  async getTrendingTVSeries(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.analyticsService.getTrendingTVSeries(query);
    return ResponseBuilder.createPaginatedResponse({
      data,
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Trending TV series retrieved successfully',
    });
  }
}
