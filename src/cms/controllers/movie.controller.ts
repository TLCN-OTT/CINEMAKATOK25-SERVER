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
      data: data,
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Movies retrieved successfully',
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
}
