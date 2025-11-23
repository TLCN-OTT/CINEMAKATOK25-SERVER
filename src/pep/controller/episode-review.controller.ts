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

import {
  CreateEpisodeReviewDto,
  EpisodeReviewDto,
  UpdateEpisodeReviewDto,
} from '../dtos/episode.-review.dto';
import { CreateReviewDto, ReviewDto, UpdateReviewDto } from '../dtos/review.dto';
import { EpisodeReviewService } from '../services/episode-review.service';

@Controller('episode-reviews')
@ApiTags('pep / Episode Reviews')
@ApiBearerAuth()
export class EpisodeReviewController {
  constructor(private readonly reviewEpisodeService: EpisodeReviewService) {}
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
    description: 'Sort order for reviews',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search reviews by content or user name',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter reviews by status (ACTIVE, BANNED). Default: ACTIVE',
    example: 'ACTIVE',
  })
  @ApiOkResponse({
    description: 'List of reviews',
    type: PaginatedApiResponseDto(ReviewDto),
  })
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.reviewEpisodeService.findReviews(query);
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
    type: PaginatedApiResponseDto(EpisodeReviewDto),
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
    description: 'Sort order for reviews',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search reviews by content or user name',
  })
  async findReviewsByUserId(@UserSession('id') userId: string, @Query() query: PaginationQueryDto) {
    const { data, total } = await this.reviewEpisodeService.findReviews({ ...query, userId });
    return {
      data: plainToInstance(ReviewDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Reviews retrieved successfully',
    };
  }
  @Get('for-episode/:episodeId')
  @ApiOperation({ summary: 'Get reviews for a specific episode by episode ID' })
  @ApiOkResponse({
    description: 'List of reviews for the episode',
    type: PaginatedApiResponseDto(EpisodeReviewDto),
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
    description: 'Sort order for reviews',
    example: '{ "createdAt": "DESC" }',
  })
  async getReviewForEpisode(
    @Param('episodeId') episodeId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const review = await this.reviewEpisodeService.findReviews({ ...query, episodeId });
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
      data: plainToInstance(ReviewDto, await this.reviewEpisodeService.findReviewById(id), {
        excludeExtraneousValues: true,
      }),
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiOkResponse({
    description: 'Review created successfully',
    type: ApiResponseDto(EpisodeReviewDto),
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  @UseGuards(JwtAuthGuard)
  async createReview(
    @UserSession('id') userId: string,
    @Body() createReviewDto: CreateEpisodeReviewDto,
  ) {
    const review = await this.reviewEpisodeService.createReview(userId, createReviewDto);
    return ResponseBuilder.createResponse({
      message: 'Review created successfully',
      data: plainToInstance(ReviewDto, review, { excludeExtraneousValues: true }),
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a review by ID' })
  @ApiOkResponse({
    description: 'Review updated successfully',
    type: ApiResponseDto(EpisodeReviewDto),
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  @ApiNotFoundResponse({
    description: 'Review not found',
  })
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('id') id: string,
    @UserSession('id') userId: string,
    @Body() updateEpisodeReviewDto: UpdateEpisodeReviewDto,
  ) {
    const review = await this.reviewEpisodeService.updateReview(id, updateEpisodeReviewDto, userId);
    return ResponseBuilder.createResponse({
      message: 'Review updated successfully',
      data: plainToInstance(EpisodeReviewDto, review, { excludeExtraneousValues: true }),
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
  async deleteReview(@Param('id') id: string, @UserSession('id') userId: string) {
    await this.reviewEpisodeService.deleteReview(id, userId);
    return {
      message: 'Review deleted successfully',
      data: null,
    };
  }

  @Get('check-owner/:id')
  @ApiOperation({ summary: 'Check if user is the owner of a review' })
  @ApiOkResponse({ description: 'Ownership check result' })
  @ApiNotFoundResponse({
    description: 'Review not found',
  })
  @UseGuards(JwtAuthGuard)
  async checkReviewOwner(@Param('id') id: string, @UserSession('id') userId: string) {
    const isOwner = await this.reviewEpisodeService.isReviewOwner(id, userId);
    return ResponseBuilder.createResponse({
      message: 'Ownership check completed',
      data: { isOwner },
    });
  }
}
