import { plainToInstance } from 'class-transformer';

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
  constructor(private readonly movieService: MovieService) {}

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
  async create(@Body() createMovieDto: CreateMovieDto) {
    const result = await this.movieService.create(createMovieDto);
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
  ) {
    const result = await this.movieService.update(id, updateMovieDto);
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
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.movieService.delete(id);
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
    console.log('Received query:', query);
    const { data, total } = await this.movieService.getTrendingMovies(query);
    console.log(data);
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
