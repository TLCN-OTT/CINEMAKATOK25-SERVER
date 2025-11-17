import { plainToInstance } from 'class-transformer';
import { UUID } from 'crypto';

import { IsAdmin } from '@app/common/decorators/admin-role.decorator';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { IsAdminGuard } from '@app/common/guards/is-admin.guard';
import { ApiResponseDto, PaginatedApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
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

import {
  CreateTVSeriesDto,
  TVSeriesDto,
  TVSeriesSummaryDto,
  TVSeriesWithNewEpisode,
  UpdateTVSeriesDto,
} from '../dtos/tvseries.dto';
import { TvSeriesService } from '../services/tvseries.service';

@Controller({
  path: 'tvseries',
  version: '1',
})
@ApiTags('cms / TV Series')
@ApiBearerAuth()
export class TvSeriesController {
  constructor(private readonly tvSeriesService: TvSeriesService) {}

  // Controller methods for TV series management
  @Get()
  @ApiOperation({ summary: 'Get all movies' })
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
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter movies by date range (e.g., {"range":"last_month"})',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all TV series',
    type: PaginatedApiResponseDto(TVSeriesSummaryDto),
  })
  async findAll(@Query() query: PaginationQueryDto) {
    console.log('Fetching all TV series with query:', query);
    const { data, total } = await this.tvSeriesService.findAll(query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(TVSeriesSummaryDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Movies retrieved successfully',
    });
  }

  @Get('/trending')
  @ApiOperation({ summary: 'Get trending TV series' })
  @ApiResponse({
    status: 200,
    description: 'List of trending TV series',
    type: PaginatedApiResponseDto(TVSeriesSummaryDto),
  })
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
  async getTrendingSeries(@Query() query: PaginationQueryDto) {
    const result = await this.tvSeriesService.findTrending(query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(TVSeriesSummaryDto, result.data, { excludeExtraneousValues: true }),
      totalItems: result.total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Trending TV series retrieved successfully',
    });
  }

  @Get('/category/:categoryId')
  @ApiOperation({ summary: 'Get TV series by category ID' })
  @ApiResponse({
    status: 200,
    description: 'List of TV series by category',
    type: PaginatedApiResponseDto(TVSeriesSummaryDto),
  })
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
  async getTvSeriesByCategoryId(
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { data, total } = await this.tvSeriesService.findByCategoryId(categoryId, query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(TVSeriesDto, data, { excludeExtraneousValues: true }),
      message: 'TV series by category retrieved successfully',
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
    });
  }

  @Get('/new-episodes')
  @ApiOperation({ summary: 'Get TV series with new episodes' })
  @ApiResponse({
    status: 200,
    description: 'List of TV series with new episodes',
    type: PaginatedApiResponseDto(TVSeriesWithNewEpisode),
  })
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
  async getTvSeriesWithNewEpisodes(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.tvSeriesService.findTvSeriesWithNewEpisodes(query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(TVSeriesWithNewEpisode, data, { excludeExtraneousValues: true }),
      message: 'TV series with new episodes retrieved successfully',
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
    });
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get TV series by ID' })
  @ApiResponse({
    status: 200,
    description: 'The TV series details',
    type: ApiResponseDto(TVSeriesDto),
  })
  @ApiResponse({
    status: 404,
    description: 'TV series not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.tvSeriesService.findOne(id);
    return ResponseBuilder.createResponse({
      data: plainToInstance(TVSeriesDto, result, { excludeExtraneousValues: true }),
      message: 'TV series retrieved successfully',
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: 'Create a new TV series' })
  @ApiResponse({
    status: 201,
    description: 'The TV series has been successfully created.',
    type: ApiResponseDto(TVSeriesDto),
  })
  async create(@Body() createTvSeriesDto: CreateTVSeriesDto) {
    const result = await this.tvSeriesService.create(createTvSeriesDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(TVSeriesDto, result, { excludeExtraneousValues: true }),
      message: 'TV series created successfully',
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Update a TV series' })
  @ApiResponse({
    status: 200,
    description: 'The TV series has been successfully updated.',
    type: ApiResponseDto(TVSeriesDto),
  })
  async update(
    @Body() updateTvSeriesDto: UpdateTVSeriesDto,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const result = await this.tvSeriesService.update(id, updateTvSeriesDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(TVSeriesDto, result, { excludeExtraneousValues: true }),
      message: 'TV series updated successfully',
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Delete a TV series' })
  @ApiResponse({
    status: 200,
    description: 'The TV series has been successfully deleted.',
  })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.tvSeriesService.delete(id);
    return ResponseBuilder.createResponse({
      message: 'TV series deleted successfully',
      data: null,
    });
  }
}
