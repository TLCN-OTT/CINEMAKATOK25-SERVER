import { plainToInstance } from 'class-transformer';

import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { PaginatedApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateDirectorDto, DirectorDto, UpdateDirectorDto } from '../dtos/director.dto';
import { DirectorService } from '../services/director.service';

@ApiTags('cms/Directors')
@Controller('directors')
@ApiBearerAuth()
export class DirectorController {
  constructor(private readonly directorService: DirectorService) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create a new director' })
  async create(@Body() createDirectorDto: CreateDirectorDto) {
    const director = await this.directorService.create(createDirectorDto);
    return ResponseBuilder.createResponse({
      message: 'Director created successfully',
      data: plainToInstance(DirectorDto, director, { excludeExtraneousValues: true }),
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all directors' })
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
    description: 'Sort order for directors',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search directors by name or nationality',
  })
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.directorService.findAll(query);
    return ResponseBuilder.createPaginatedResponse({
      data: data.map(director =>
        plainToInstance(DirectorDto, director, { excludeExtraneousValues: true }),
      ),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Directors retrieved successfully',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a director by ID' })
  @ApiParam({
    name: 'id',
    description: 'Director ID',
    type: String,
  })
  async findOne(@Param('id') id: string) {
    const director = await this.directorService.findOne(id);
    return ResponseBuilder.createResponse({
      message: 'Director retrieved successfully',
      data: plainToInstance(DirectorDto, director, { excludeExtraneousValues: true }),
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Update a director' })
  @ApiParam({
    name: 'id',
    description: 'Director ID',
    type: String,
  })
  async update(@Param('id') id: string, @Body() updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorService.update(id, updateDirectorDto);
    return ResponseBuilder.createResponse({
      message: 'Director updated successfully',
      data: plainToInstance(DirectorDto, director, { excludeExtraneousValues: true }),
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Delete a director' })
  @ApiParam({
    name: 'id',
    description: 'Director ID',
    type: String,
  })
  async remove(@Param('id') id: string) {
    await this.directorService.remove(id);
    return ResponseBuilder.createResponse({
      message: 'Director deleted successfully',
      data: null,
    });
  }
}
