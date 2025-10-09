import { plainToClass } from 'class-transformer';

import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { ResponseBuilder } from '@app/common/utils/dto';
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
  constructor(private readonly tagService: TagService) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create a new tag' })
  async create(@Body() createTagDto: CreateTagDto) {
    const tag = await this.tagService.create(createTagDto);
    return ResponseBuilder.createResponse({
      data: plainToClass(TagDto, tag, { excludeExtraneousValues: true }),
      message: 'Tag created successfully',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search tags by name',
  })
  async findAll(@Query('search') search?: string) {
    const tags = search ? await this.tagService.search(search) : await this.tagService.findAll();
    return ResponseBuilder.createResponse({
      data: tags.map(tag => plainToClass(TagDto, tag, { excludeExtraneousValues: true })),
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
      data: plainToClass(TagDto, tag, { excludeExtraneousValues: true }),
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
  async update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    const tag = await this.tagService.update(id, updateTagDto);
    return ResponseBuilder.createResponse({
      data: plainToClass(TagDto, tag, { excludeExtraneousValues: true }),
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
  async remove(@Param('id') id: string) {
    await this.tagService.remove(id);
    return ResponseBuilder.createResponse({
      data: null,
      message: 'Tag deleted successfully',
    });
  }
}
