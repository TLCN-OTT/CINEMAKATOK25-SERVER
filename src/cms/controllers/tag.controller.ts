import { AuditLogService } from 'src/audit-log/service/audit-log.service';

import { plainToClass, plainToInstance } from 'class-transformer';

import { UserSession } from '@app/common/decorators';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { PaginatedApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateTagDto, TagDto, UpdateTagDto } from '../dtos/tag.dto';
import { TagService } from '../services/tag.service';

@Controller({
  path: 'tags',
  version: '1',
})
@ApiTags('cms / Tags')
@ApiBearerAuth()
export class TagController {
  constructor(
    private readonly tagService: TagService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create a new tag' })
  async create(@Body() createTagDto: CreateTagDto, @UserSession('id') userId: string) {
    const tag = await this.tagService.create(createTagDto);
    await this.auditLogService.log({
      action: LOG_ACTION.CREATE_TAG,
      userId: userId,
      description: `Created tag with ID ${tag.id} by admin ${userId}`,
    });
    return ResponseBuilder.createResponse({
      data: plainToInstance(TagDto, tag, { excludeExtraneousValues: true }),
      message: 'Tag created successfully',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
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
    description: 'Sort order for tags',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search tags by name',
  })
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.tagService.findAll(query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(TagDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Tags retrieved successfully',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by ID' })
  @ApiParam({
    name: 'id',
    description: 'Tag ID',
    type: String,
  })
  async findOne(@Param('id') id: string) {
    const tag = await this.tagService.findOne(id);
    return ResponseBuilder.createResponse({
      data: plainToInstance(TagDto, tag, { excludeExtraneousValues: true }),
      message: 'Tag retrieved successfully',
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Update a tag' })
  @ApiParam({
    name: 'id',
    description: 'Tag ID',
    type: String,
  })
  async update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
    @UserSession('id') userId: string,
  ) {
    const tag = await this.tagService.update(id, updateTagDto);
    await this.auditLogService.log({
      action: LOG_ACTION.UPDATE_TAG,
      userId: userId,
      description: `Updated tag with ID ${tag.id} by admin ${userId}`,
    });
    return ResponseBuilder.createResponse({
      data: plainToInstance(TagDto, tag, { excludeExtraneousValues: true }),
      message: 'Tag updated successfully',
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Delete a tag' })
  @ApiParam({
    name: 'id',
    description: 'Tag ID',
    type: String,
  })
  async remove(@Param('id') id: string, @UserSession('id') userId: string) {
    await this.tagService.remove(id);
    await this.auditLogService.log({
      action: LOG_ACTION.DELETE_TAG,
      userId: userId,
      description: `Deleted tag with ID ${id} by admin ${userId}`,
    });
    return ResponseBuilder.createResponse({
      data: null,
      message: 'Tag deleted successfully',
    });
  }
}
