import { plainToInstance } from 'class-transformer';

import { UserSession } from '@app/common/decorators';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { OptionalJwtAuthGuard } from '@app/common/guards/optional-jwt-auth.guard';
import { ApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CreateFavoriteDto,
  DeleteFavoriteDto,
  FavoriteContentDto,
  FavoriteDto,
} from '../dtos/favorite.dto';
import { FavoriteService } from '../services/favorite.service';

@ApiTags('pep/Favorites')
@Controller('favorites')
@ApiBearerAuth()
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @ApiOperation({ summary: 'Add content to favorites' })
  @ApiResponse({
    status: 201,
    description: 'Content added to favorites successfully',
    type: ApiResponseDto(FavoriteContentDto),
  })
  @UseGuards(JwtAuthGuard)
  async createFavorite(
    @Body() createFavoriteDto: CreateFavoriteDto,
    @UserSession('id') userId: string,
  ) {
    return ResponseBuilder.createResponse({
      message: 'Content added to favorites successfully',
      data: await this.favoriteService.createFavorite(createFavoriteDto, userId),
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({
    status: 200,
    description: 'User favorites retrieved successfully',
  })
  @UseGuards(JwtAuthGuard)
  async getFavorites(@UserSession('id') user: string) {
    const favorites = await this.favoriteService.getUserFavorites(user);
    return ResponseBuilder.createResponse({
      message: 'User favorites retrieved successfully',
      data: favorites,
    });
  }

  @Get(':contentId/status')
  @ApiOperation({ summary: 'Get favorite status for content (logged in or guest)' })
  @ApiResponse({
    status: 200,
    description: 'Favorite status retrieved successfully',
    type: ApiResponseDto(FavoriteContentDto),
  })
  @UseGuards(OptionalJwtAuthGuard)
  async getFavoriteStatus(
    @Param('contentId') contentId: string,
    @UserSession('id') userId?: string, // userId có thể undefined
  ) {
    console.log('User ID in getFavoriteStatus:', userId);
    const status = await this.favoriteService.getFavoriteStatus(contentId, userId);
    return ResponseBuilder.createResponse({
      message: 'Favorite status retrieved successfully',
      data: status,
    });
  }

  @Delete(':contentId')
  @ApiOperation({ summary: 'Remove content from favorites' })
  @ApiResponse({
    status: 200,
    description: 'Content removed from favorites successfully',
  })
  @UseGuards(JwtAuthGuard)
  async removeFavorite(@Param('contentId') contentId: string, @UserSession('id') userId: string) {
    await this.favoriteService.removeFavorite(contentId, userId);
    return ResponseBuilder.createResponse({
      message: 'Content removed from favorites successfully',
      data: null,
    });
  }

  @Delete()
  @ApiOperation({ summary: 'Remove multiple contents from favorites' })
  @ApiResponse({
    status: 200,
    description: 'Contents removed from favorites successfully',
  })
  @UseGuards(JwtAuthGuard)
  async removeArrayFavorite(
    @Body() deleteFavoriteDto: DeleteFavoriteDto,
    @UserSession('id') userId: string,
  ) {
    await this.favoriteService.removeArrayFavorite(deleteFavoriteDto.contentIds, userId);
    return ResponseBuilder.createResponse({
      message: 'Contents removed from favorites successfully',
      data: null,
    });
  }
}
