import { AuditLogService } from 'src/audit-log/service/audit-log.service';

import { plainToInstance } from 'class-transformer';

import { UserSession } from '@app/common/decorators/userSession.decorator';
import { LOG_ACTION } from '@app/common/enums/log.enum';
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
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CreateMovieDto, MovieDto, UpdateMovieDto } from '../dtos/movies.dto';
import { MovieService } from '../services/movie.service';

@Controller({
  path: 'movies',
  version: '1',
})
@ApiTags('cms / Movie')
@ApiBearerAuth()
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create new movie' })
  @ApiResponse({
    status: 201,
    description: 'The movie has been successfully created.',
    type: ApiResponseDto(MovieDto),
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async create(@Body() createMovieDto: CreateMovieDto, @UserSession('id') userId: string) {
    const result = await this.movieService.create(createMovieDto);
    await this.auditLogService.log({
      action: LOG_ACTION.CREATE_MOVIE,
      userId: userId,
      description: `Created movie with ID ${result.id} by admin ${userId}`,
    });
    return ResponseBuilder.createResponse({
      data: plainToInstance(MovieDto, result, { excludeExtraneousValues: true }),
      message: 'Movie created successfully',
    });
  }

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
  @ApiResponse({
    status: 200,
    description: 'List of all movies',
    type: PaginatedApiResponseDto(MovieDto),
  })
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.movieService.findAll(query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(MovieDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Movies retrieved successfully',
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Update movie' })
  @ApiResponse({
    status: 200,
    description: 'The movie has been successfully updated.',
    type: ApiResponseDto(MovieDto),
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiNotFoundResponse({
    description: 'Movie not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
    @UserSession('id') userId: string,
  ) {
    const result = await this.movieService.update(id, updateMovieDto);
    await this.auditLogService.log({
      action: LOG_ACTION.UPDATE_MOVIE,
      userId: userId,
      description: `Updated movie with ID ${result.id} by admin ${userId}`,
    });
    return ResponseBuilder.createResponse({
      data: plainToInstance(MovieDto, result, { excludeExtraneousValues: true }),
      message: 'Movie updated successfully',
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Delete movie' })
  @ApiResponse({
    status: 200,
    description: 'The movie has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Movie not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async delete(@Param('id', new ParseUUIDPipe()) id: string, @UserSession('id') userId: string) {
    await this.movieService.delete(id);
    await this.auditLogService.log({
      action: LOG_ACTION.DELETE_MOVIE,
      userId: userId,
      description: `Deleted movie with ID ${id} by admin ${userId}`,
    });
    return ResponseBuilder.createResponse({
      data: null,
      message: 'Movie deleted successfully',
    });
  }

  @Get('trending-movies')
  @ApiOperation({ summary: 'Get trending movies' })
  @ApiResponse({
    status: 200,
    description: 'List of trending movies',
    type: PaginatedApiResponseDto(MovieDto),
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
    description: 'Sort order for movies',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search movies by title',
  })
  async getTrendingMovies(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.movieService.getTrendingMovies(query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(MovieDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Trending movies retrieved successfully',
    });
  }
  @Get('new-releases')
  @ApiOperation({ summary: 'Get new release movies' })
  @ApiResponse({
    status: 200,
    description: 'List of new release movies',
    type: PaginatedApiResponseDto(MovieDto),
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
    description: 'Sort order for movies',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search movies by title',
  })
  async getNewReleaseMovies(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.movieService.findAll(query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(MovieDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'New release movies retrieved successfully',
    });
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get movies by category' })
  @ApiResponse({
    status: 200,
    description: 'List of movies in the specified category',
    type: PaginatedApiResponseDto(MovieDto),
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
    description: 'Sort order for movies',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search movies by title, description, etc.',
    example: '{ "title": "Inception", "description": "dream" }',
  })
  async getMoviesByCategory(
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { data, total } = await this.movieService.getMoviesByCategory(categoryId, query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(MovieDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Movies by category retrieved successfully',
    });
  }
  @Get(':movieId/recommendations')
  @ApiOperation({ summary: 'Get movie recommendations by movie ID' })
  @ApiResponse({
    status: 200,
    description: 'List of recommended movies',
    type: PaginatedApiResponseDto(MovieDto),
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
    description: 'Sort order for movies',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search movies by title',
    example: '{ "title": "Inception", "description": "dream" }',
  })
  async getRecommendationsByMovieId(
    @Param('movieId', new ParseUUIDPipe()) movieId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { data, total } = await this.movieService.getRecommendationsByMovieId(movieId, query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(MovieDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Movie recommendations retrieved successfully',
    });
  }
  // @Get('top-rated/movies')
  // @ApiOperation({ summary: 'Get top rated movies' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'List of top rated movies',
  //   type: PaginatedApiResponseDto(MovieDto),
  // })
  // @ApiQuery({
  //   name: 'page',
  //   required: false,
  //   type: Number,
  //   description: 'Page number for pagination',
  // })
  // @ApiQuery({
  //   name: 'limit',
  //   required: false,
  //   type: Number,
  //   description: 'Number of items per page',
  // })
  // @ApiQuery({
  //   name: 'sort',
  //   required: false,
  //   type: String,
  //   description: 'Sort order for movies',
  //   example: '{ "createdAt": "DESC" }',
  // })
  // @ApiQuery({
  //   name: 'search',
  //   required: false,
  //   description: 'Search movies by title',
  //   example: '{ "title": "Inception", "description": "dream" }',
  // })
  // async getTopRatedMovies(@Query() query: PaginationQueryDto) {
  //   const { data, total } = await this.movieService.getTopRatedMovies(query);
  //   return ResponseBuilder.createPaginatedResponse({
  //     data: plainToInstance(MovieDto, data, { excludeExtraneousValues: true }),
  //     totalItems: total,
  //     currentPage: query.page || 1,
  //     itemsPerPage: query.limit || 10,
  //     message: 'Top rated movies retrieved successfully',
  //   });
  // }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  @ApiResponse({
    status: 200,
    description: 'The movie details',
    type: ApiResponseDto(MovieDto),
  })
  @ApiNotFoundResponse({
    description: 'Movie not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.movieService.findOne(id);
    return ResponseBuilder.createResponse({
      data: plainToInstance(MovieDto, result, { excludeExtraneousValues: true }),
      message: 'Movie retrieved successfully',
    });
  }
}
