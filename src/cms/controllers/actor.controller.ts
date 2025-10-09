import { plainToClass } from 'class-transformer';

import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { ResponseBuilder } from '@app/common/utils/dto';
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
      data: plainToClass(ActorDto, actor, { excludeExtraneousValues: true }),
      message: 'Content updated successfully',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all actors' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search actors by name or nationality',
  })
  async findAll(@Query('search') search?: string) {
    const actors = search
      ? await this.actorService.search(search)
      : await this.actorService.findAll();

    return ResponseBuilder.createResponse({
      message: 'Actors retrieved successfully',
      data: actors.map(actor => plainToClass(ActorDto, actor, { excludeExtraneousValues: true })),
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
      data: plainToClass(ActorDto, actor, { excludeExtraneousValues: true }),
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
      data: plainToClass(ActorDto, actor, { excludeExtraneousValues: true }),
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
