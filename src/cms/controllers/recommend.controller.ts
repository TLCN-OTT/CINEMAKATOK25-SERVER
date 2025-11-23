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
import { RecommendationDto } from '../dtos/recommendation.dto';
import { ActorService } from '../services/actor.service';
import { RecommendService } from '../services/recommend.service';

@ApiTags('cms/ Recommendations')
@Controller('recommendations')
@ApiBearerAuth()
export class RecommendationsController {
  constructor(private readonly recommendService: RecommendService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get recommendations for a user' })
  async get(@UserSession('id') userId: string) {
    const { movies, tvSeries } = await this.recommendService.getFastApiData(userId, 10);

    // Combine movies and tvSeries into a single array for the data property
    const combinedData = [...movies, ...tvSeries];
    console.log('Combined Data:', combinedData);
    const data = combinedData.map((item: any) => ({
      ...plainToInstance(RecommendationDto, item, { excludeExtraneousValues: true }),
      metaData: item.metaData,
    }));
    return ResponseBuilder.createPaginatedResponse({
      data: data,
      totalItems: combinedData.length,
      message: 'Recommendations fetched successfully',
      currentPage: 1,
      itemsPerPage: 10,
    });
  }
}
