import { plainToInstance } from 'class-transformer';

import { UserSession } from '@app/common/decorators';
import { IsAdmin } from '@app/common/decorators/admin-role.decorator';
import { IsAdminGuard } from '@app/common/guards';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { ApiResponseDto } from '@app/common/utils/dto';
import { PaginatedApiResponseDto } from '@app/common/utils/dto/paginated-api-response.dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { ResponseBuilder } from '@app/common/utils/dto/response-builder';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CreateReviewDto, ReviewDto, UpdateReviewDto } from '../dtos/review.dto';
import { ReviewService } from '../services/review.service';

@Controller('reviews')
@ApiTags('pep/Reviews')
@ApiBearerAuth()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}
  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
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
  @ApiOkResponse({
    description: 'List of reviews',
    type: PaginatedApiResponseDto(ReviewDto),
  })
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.reviewService.findReviews(query);
    return {
      data: plainToInstance(ReviewDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Reviews retrieved successfully',
    };
  }
  @Get('by-user')
  @ApiOperation({ summary: 'Get reviews by user ID' })
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    description: 'List of reviews by user',
    type: PaginatedApiResponseDto(ReviewDto),
  })
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
  async findReviewsByUserId(@UserSession('id') userId: string, @Query() query: PaginationQueryDto) {
    const { data, total } = await this.reviewService.findReviews({ ...query, userId });
    return {
      data: plainToInstance(ReviewDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Reviews retrieved successfully',
    };
  }
  @Get('for-content/:contentId')
  @ApiOperation({ summary: 'Get reviews for a specific content by content ID' })
  @ApiOkResponse({
    description: 'List of reviews for the content',
    type: PaginatedApiResponseDto(ReviewDto),
  })
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
  async getReviewForContent(
    @Param('contentId') contentId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const review = await this.reviewService.findReviews({ ...query, contentId });
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(ReviewDto, review.data, { excludeExtraneousValues: true }),
      totalItems: review.total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Reviews retrieved successfully',
    });
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiOkResponse({ description: 'Review details', type: ApiResponseDto(ReviewDto) })
  @ApiNotFoundResponse({
    description: 'Review not found',
  })
  async findOne(@Param('id') id: string) {
    return ResponseBuilder.createResponse({
      message: 'Review retrieved successfully',
      data: plainToInstance(ReviewDto, await this.reviewService.findReviewById(id), {
        excludeExtraneousValues: true,
      }),
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiOkResponse({ description: 'Review created successfully', type: ApiResponseDto(ReviewDto) })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  @UseGuards(JwtAuthGuard)
  async createReview(@UserSession('id') userId: string, @Body() createReviewDto: CreateReviewDto) {
    const review = await this.reviewService.createReview(userId, createReviewDto);
    return plainToInstance(ReviewDto, review, { excludeExtraneousValues: true });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a review by ID' })
  @ApiOkResponse({ description: 'Review updated successfully', type: ApiResponseDto(ReviewDto) })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  @ApiNotFoundResponse({
    description: 'Review not found',
  })
  @UseGuards(JwtAuthGuard)
  async updateReview(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewService.updateReview(id, updateReviewDto);
    return ResponseBuilder.createResponse({
      message: 'Review updated successfully',
      data: plainToInstance(ReviewDto, review, { excludeExtraneousValues: true }),
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review by ID' })
  @ApiOkResponse({ description: 'Review deleted successfully', type: ApiResponseDto(ReviewDto) })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  @ApiNotFoundResponse({
    description: 'Review not found',
  })
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Param('id') id: string) {
    await this.reviewService.deleteReview(id);
    return {
      message: 'Review deleted successfully',
      data: null,
    };
  }
}
