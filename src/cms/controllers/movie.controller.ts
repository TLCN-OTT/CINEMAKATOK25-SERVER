import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { ApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
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
      data: result,
      message: 'Movie created successfully',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all movies' })
  @ApiResponse({
    status: 200,
    description: 'List of all movies',
    type: ApiResponseDto(MovieDto),
  })
  async findAll() {
    const result = await this.movieService.findAll();
    return ResponseBuilder.createResponse({
      data: result,
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
      data: result,
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
      data: result,
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
