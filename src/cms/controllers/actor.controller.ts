import { plainToClass, plainToInstance } from 'class-transformer';

import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { PaginatedApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { ActorDto, CreateActorDto, UpdateActorDto } from '../dtos/actor.dto';
import { ActorService } from '../services/actor.service';

@ApiTags('cms/Actors')
@Controller('actors')
@ApiBearerAuth()
export class ActorController {
  constructor(private readonly actorService: ActorService) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create a new actor' })
  async create(@Body() createActorDto: CreateActorDto) {
    const actor = await this.actorService.create(createActorDto);

    return ResponseBuilder.createResponse({
      data: plainToInstance(ActorDto, actor, { excludeExtraneousValues: true }),
      message: 'Content updated successfully',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all actors' })
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
    description: 'Sort order for actors',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search actors by name or nationality',
  })
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.actorService.findAll(query);

    return ResponseBuilder.createPaginatedResponse({
      data: data.map(actor => plainToInstance(ActorDto, actor, { excludeExtraneousValues: true })),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Actors retrieved successfully',
    });
  }

  @Get('top/list')
  @ApiOperation({ summary: 'Get top actors by number of contents' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getTopActors(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.actorService.getTopActors(query);

    return ResponseBuilder.createPaginatedResponse({
      data: data.map(actor => ({
        ...plainToInstance(ActorDto, actor, { excludeExtraneousValues: true }),
        contentCount: actor.contentCount || 0,
      })),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Top actors retrieved successfully',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an actor by ID' })
  @ApiParam({
    name: 'id',
    description: 'Actor ID',
    type: String,
  })
  async findOne(@Param('id') id: string) {
    const actor = await this.actorService.findOne(id);
    return ResponseBuilder.createResponse({
      message: 'Actor retrieved successfully',
      data: plainToInstance(ActorDto, actor, { excludeExtraneousValues: true }),
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Update an actor' })
  @ApiParam({
    name: 'id',
    description: 'Actor ID',
    type: String,
  })
  async update(@Param('id') id: string, @Body() updateActorDto: UpdateActorDto) {
    const actor = await this.actorService.update(id, updateActorDto);
    return ResponseBuilder.createResponse({
      message: 'Actor updated successfully',
      data: plainToInstance(ActorDto, actor, { excludeExtraneousValues: true }),
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Delete an actor' })
  @ApiParam({
    name: 'id',
    description: 'Actor ID',
    type: String,
  })
  async remove(@Param('id') id: string) {
    await this.actorService.remove(id);
    return ResponseBuilder.createResponse({
      message: 'Actor deleted successfully',
      data: null,
    });
  }
}
