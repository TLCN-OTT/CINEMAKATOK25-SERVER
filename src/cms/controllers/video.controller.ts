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

import { CreateVideoDto, UpdateVideoDto, VideoDto } from '../dtos/video.dto';
import { VideoService } from '../services/video.service';

@Controller({
  path: 'videos',
  version: '1',
})
@ApiTags('cms / Video')
@ApiBearerAuth()
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create new video' })
  @ApiResponse({
    status: 201,
    description: 'The video has been successfully created.',
    type: ApiResponseDto(VideoDto),
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
  async create(@Body() createVideoDto: CreateVideoDto) {
    const result = await this.videoService.create(createVideoDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(VideoDto, result, { excludeExtraneousValues: true }),
      message: 'Video created successfully',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all videos' })
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
    description: 'Sort order for videos',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search videos by title',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all videos',
    type: PaginatedApiResponseDto(VideoDto),
  })
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.videoService.findAll(query);
    return ResponseBuilder.createPaginatedResponse({
      data: data.map(video => plainToInstance(VideoDto, video, { excludeExtraneousValues: true })),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Videos retrieved successfully',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  @ApiResponse({
    status: 200,
    description: 'The video details',
    type: ApiResponseDto(VideoDto),
  })
  @ApiNotFoundResponse({
    description: 'Video not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.videoService.findOne(id);
    return ResponseBuilder.createResponse({
      data: plainToInstance(VideoDto, result, { excludeExtraneousValues: true }),
      message: 'Video retrieved successfully',
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Update video' })
  @ApiResponse({
    status: 200,
    description: 'The video has been successfully updated.',
    type: ApiResponseDto(VideoDto),
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiNotFoundResponse({
    description: 'Video not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateVideoDto: UpdateVideoDto,
  ) {
    const result = await this.videoService.update(id, updateVideoDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(VideoDto, result, { excludeExtraneousValues: true }),
      message: 'Video updated successfully',
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Delete video' })
  @ApiResponse({
    status: 200,
    description: 'The video has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Video not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.videoService.delete(id);
    return ResponseBuilder.createResponse({
      data: null,
      message: 'Video deleted successfully',
    });
  }
}
