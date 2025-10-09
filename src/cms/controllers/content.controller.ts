import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { ApiResponseDto } from '@app/common/utils/dto';
import { ResponseBuilder } from '@app/common/utils/dto';
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
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ContentDto, CreateContentDto, UpdateContentDto } from '../dtos/content.dto';
import { ContentService } from '../services/content.service';

@Controller({
  path: 'contents',
  version: '1',
})
@ApiTags('cms / Content')
@ApiBearerAuth()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create new content (movie or TV series)' })
  @ApiResponse({
    status: 201,
    description: 'The content has been successfully created.',
    type: ApiResponseDto(ContentDto),
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or missing required fields',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async create(@Body() createContentDto: CreateContentDto) {
    const result = await this.contentService.create(createContentDto);
    return ResponseBuilder.createResponse({
      data: result,
      message: 'Content created successfully',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all contents with their relationships' })
  @ApiResponse({
    status: 200,
    description: 'List of all contents including categories, actors, directors, and tags',
    type: ApiResponseDto(ContentDto),
  })
  async findAll() {
    const result = await this.contentService.findAll();
    return ResponseBuilder.createResponse({
      data: result,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID with all relationships' })
  @ApiResponse({
    status: 200,
    description: 'Content details including categories, actors, directors, and tags',
    type: ApiResponseDto(ContentDto),
  })
  @ApiNotFoundResponse({
    description: 'Content not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.contentService.findOne(id);
    return ResponseBuilder.createResponse({
      data: result,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Update content and its relationships' })
  @ApiResponse({
    status: 200,
    description: 'The content has been successfully updated.',
    type: ApiResponseDto(ContentDto),
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or missing required fields',
  })
  @ApiNotFoundResponse({
    description: 'Content not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    const result = await this.contentService.update(id, updateContentDto);
    return ResponseBuilder.createResponse({
      data: result,
      message: 'Content updated successfully',
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Delete content and its relationships' })
  @ApiResponse({
    status: 200,
    description: 'Content and related data have been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Content not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.contentService.delete(id);
    return ResponseBuilder.createResponse({
      data: null,
      message: 'Content deleted successfully',
    });
  }
}
