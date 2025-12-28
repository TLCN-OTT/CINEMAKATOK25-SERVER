import { AuditLogService } from 'src/audit-log/service/audit-log.service';

import { plainToClass, plainToInstance } from 'class-transformer';

import { UserSession } from '@app/common/decorators';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { PaginatedApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import {
  ActorContentDto,
  ActorDetailDto,
  ActorDto,
  CreateActorDto,
  UpdateActorDto,
} from '../dtos/actor.dto';
import { ActorService } from '../services/actor.service';

@ApiTags('cms/Actors')
@Controller('actors')
@ApiBearerAuth()
export class ActorController {
  constructor(
    private readonly actorService: ActorService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create a new actor' })
  async create(@Body() createActorDto: CreateActorDto, @UserSession('id') userId: string) {
    const actor = await this.actorService.create(createActorDto);
    await this.auditLogService.log({
      action: LOG_ACTION.CREATE_ACTOR,
      userId: userId,
      description: `Created actor with ID ${actor.id} by admin ${userId}`,
    });

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
  @ApiOperation({ summary: 'Get an actor by ID with all contents' })
  @ApiParam({
    name: 'id',
    description: 'Actor ID',
    type: String,
  })
  async findOne(@Param('id') id: string) {
    const actor = await this.actorService.findOne(id);

    // Transform response với contents
    const actorDetail: any = {
      ...plainToInstance(ActorDto, actor, { excludeExtraneousValues: true }),
      contents:
        actor.contents?.map((content: any) =>
          plainToInstance(
            ActorContentDto,
            {
              id: content.movieOrSeriesId, // Movie ID hoặc TVSeries ID
              contentId: content.id, // Content ID (metadata)
              type: content.type,
              title: content.title,
              description: content.description,
              thumbnail: content.thumbnail,
              releaseDate: content.releaseDate,
              rating: content.rating,
              duration: content.duration,
            },
            { excludeExtraneousValues: true },
          ),
        ) || [],
      contentCount: actor.contents?.length || 0,
    };

    return ResponseBuilder.createResponse({
      message: 'Actor retrieved successfully',
      data: actorDetail,
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
  async update(
    @Param('id') id: string,
    @Body() updateActorDto: UpdateActorDto,
    @UserSession('id') userId: string,
  ) {
    const actor = await this.actorService.update(id, updateActorDto);
    await this.auditLogService.log({
      action: LOG_ACTION.UPDATE_ACTOR,
      userId: userId,
      description: `Updated actor with ID ${actor.id} by admin ${userId}`,
    });
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
  async remove(@Param('id') id: string, @UserSession('id') userId: string) {
    await this.actorService.remove(id);
    await this.auditLogService.log({
      action: LOG_ACTION.DELETE_ACTOR,
      userId: userId,
      description: `Deleted actor with ID ${id} by admin ${userId}`,
    });
    return ResponseBuilder.createResponse({
      message: 'Actor deleted successfully',
      data: null,
    });
  }
}
