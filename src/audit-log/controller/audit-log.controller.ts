import { create } from 'node_modules/axios/index.cjs';

import { plainToInstance } from 'class-transformer';

import { UserSession } from '@app/common/decorators';
import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { ApiResponseDto, PaginatedApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuditLogDto, AuditLogVideo } from '../dtos/audit-log.dto';
import { AuditLogService } from '../service/audit-log.service';

// import { AdminGuard } from '...'; // Giả sử bạn có Guard bảo vệ admin

@Controller('audit-logs')
@ApiTags('gsa / Audit Logs')
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiProperty({ description: 'Get audit logs with an optional limit' })
  @ApiResponse({
    status: 200,
    description: 'List of audit logs',
    type: PaginatedApiResponseDto(AuditLogDto),
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
  async getLogs(@Query() query: PaginationQueryDto) {
    const results = await this.auditLogService.findAll(query);
    return ResponseBuilder.createPaginatedResponse({
      data: results.result.map(log =>
        plainToInstance(AuditLogDto, log, { excludeExtraneousValues: true }),
      ),
      totalItems: results.total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 20,
      message: 'Audit logs retrieved successfully',
    });
  }

  @Post('/video-action')
  @UseGuards(JwtAuthGuard)
  @ApiProperty({ description: 'Create a new audit log entry' })
  @ApiResponse({
    status: 201,
    description: 'The audit log has been created.',
    type: ApiResponseDto(AuditLogDto),
  })
  async createLog(@UserSession('id') userId: string, @Body() auditLogVideo: AuditLogVideo) {
    const log = await this.auditLogService.logVideoAction(userId, auditLogVideo.videoId);
    return ResponseBuilder.createResponse({
      data: plainToInstance(AuditLogDto, log, { excludeExtraneousValues: true }),
      message: 'Audit log created successfully',
    });
  }
}
