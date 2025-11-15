import { plainToClass, plainToInstance } from 'class-transformer';

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
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { TVSeriesCategory } from '../dtos/tvseries.dto';
import { CategoryService } from '../services/category.service';

@Controller({
  path: 'categories',
  version: '1',
})
@ApiTags('cms / Categories')
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Create new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
    type: ApiResponseDto(CategoryDto),
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
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoryService.create(createCategoryDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(CategoryDto, category, { excludeExtraneousValues: true }),
      message: 'Category created successfully',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
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
    description: 'Sort order for categories',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search categories by name',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all categories',
    type: PaginatedApiResponseDto(CategoryDto),
  })
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.categoryService.findAll(query);
    return ResponseBuilder.createPaginatedResponse({
      data: data.map(category =>
        plainToInstance(CategoryDto, category, { excludeExtraneousValues: true }),
      ),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Categories retrieved successfully',
    });
  }
  @Get('with-count')
  @ApiOperation({ summary: 'Get all categories with TV series count' })
  @ApiResponse({
    status: 200,
    description: 'List of categories with total TV series',
    type: PaginatedApiResponseDto(TVSeriesCategory),
  })
  async findAllWithCount() {
    const categories = await this.categoryService.findAllWithTVSeriesCount();
    return ResponseBuilder.createResponse({
      data: plainToInstance(TVSeriesCategory, categories, { excludeExtraneousValues: true }),
      message: 'Categories with count retrieved successfully',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The category details',
    type: ApiResponseDto(CategoryDto),
  })
  @ApiNotFoundResponse({
    description: 'Category not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const category = await this.categoryService.findOne(id);
    return ResponseBuilder.createResponse({
      data: plainToInstance(CategoryDto, category, { excludeExtraneousValues: true }),
      message: 'Category retrieved successfully',
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Update category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
    type: ApiResponseDto(CategoryDto),
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiNotFoundResponse({
    description: 'Category not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.update(id, updateCategoryDto);
    return ResponseBuilder.createResponse({
      data: plainToInstance(CategoryDto, category, { excludeExtraneousValues: true }),
      message: 'Category updated successfully',
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: '[ADMIN] Delete category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Category not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.categoryService.remove(id);
    return ResponseBuilder.createResponse({
      data: null,
      message: 'Category deleted successfully',
    });
  }
}
