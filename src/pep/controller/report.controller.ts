import { plainToInstance } from 'class-transformer';

import { UserSession } from '@app/common/decorators';
import { IsAdminGuard } from '@app/common/guards';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { ApiResponseDto } from '@app/common/utils/dto';
import { PaginatedApiResponseDto } from '@app/common/utils/dto/paginated-api-response.dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { ResponseBuilder } from '@app/common/utils/dto/response-builder';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CreateReportDto, ReportDto } from '../dtos/report.dto';
import { ReportService } from '../services/report.service';

@Controller('reports')
@ApiTags('pep/Reports')
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'Report a review or episode review' })
  @ApiOkResponse({ description: 'Report submitted successfully', type: ApiResponseDto(ReportDto) })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
  })
  @UseGuards(JwtAuthGuard)
  async createReport(@UserSession('id') userId: string, @Body() createReportDto: CreateReportDto) {
    const report = await this.reportService.createReport(userId, createReportDto);
    return ResponseBuilder.createResponse({
      message: 'Report submitted successfully',
      data: plainToInstance(ReportDto, report, { excludeExtraneousValues: true }),
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports (Admin only)' })
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
    description: 'Sort order for reports',
    example: '{ "createdAt": "DESC" }',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search reports by reporter name, reason, type, or status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter reports by status (PENDING, APPROVED, REJECTED)',
    example: 'PENDING',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reports',
    type: PaginatedApiResponseDto(ReportDto),
  })
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, total } = await this.reportService.findAllReports(query);
    return ResponseBuilder.createPaginatedResponse({
      data: plainToInstance(ReportDto, data, { excludeExtraneousValues: true }),
      totalItems: total,
      currentPage: query.page || 1,
      itemsPerPage: query.limit || 10,
      message: 'Reports retrieved successfully',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report by ID (Admin only)' })
  @ApiOkResponse({ description: 'Report details', type: ApiResponseDto(ReportDto) })
  @ApiNotFoundResponse({
    description: 'Report not found',
  })
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  async findOne(@Param('id') id: string) {
    const report = await this.reportService.findReportById(id);
    return ResponseBuilder.createResponse({
      message: 'Report retrieved successfully',
      data: plainToInstance(ReportDto, report, { excludeExtraneousValues: true }),
    });
  }

  @Put('ban/:type/:id')
  @ApiOperation({ summary: 'Ban a review or episode review (Admin only)' })
  @ApiOkResponse({ description: 'Item banned successfully' })
  @ApiNotFoundResponse({
    description: 'Item not found',
  })
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  async banItem(@Param('type') type: string, @Param('id') id: string) {
    await this.reportService.banItem(type, id);
    return ResponseBuilder.createResponse({
      message: 'Item banned successfully',
      data: null,
    });
  }

  @Put('unban/:type/:id')
  @ApiOperation({ summary: 'Unban a review or episode review (Admin only)' })
  @ApiOkResponse({ description: 'Item unbanned successfully' })
  @ApiNotFoundResponse({
    description: 'Item not found',
  })
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  async unbanItem(@Param('type') type: string, @Param('id') id: string) {
    await this.reportService.unbanItem(type, id);
    return ResponseBuilder.createResponse({
      message: 'Item unbanned successfully',
      data: null,
    });
  }

  @Put('approve/:type/:id')
  @ApiOperation({ summary: 'Approve a review or episode review (Admin only)' })
  @ApiOkResponse({ description: 'Item approved successfully' })
  @ApiNotFoundResponse({
    description: 'Item not found',
  })
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  async approveItem(@Param('type') type: string, @Param('id') id: string) {
    await this.reportService.approveItem(type, id);
    return ResponseBuilder.createResponse({
      message: 'Item approved successfully',
      data: null,
    });
  }

  @Put('reject/:type/:id')
  @ApiOperation({ summary: 'Reject a review or episode review (Admin only)' })
  @ApiOkResponse({ description: 'Item rejected successfully' })
  @ApiNotFoundResponse({
    description: 'Item not found',
  })
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  async rejectItem(@Param('type') type: string, @Param('id') id: string) {
    await this.reportService.rejectItem(type, id);
    return ResponseBuilder.createResponse({
      message: 'Item rejected successfully',
      data: null,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report (Admin only)' })
  @ApiOkResponse({ description: 'Report deleted successfully' })
  @ApiNotFoundResponse({
    description: 'Report not found',
  })
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  async deleteReport(@Param('id') id: string) {
    await this.reportService.deleteReport(id);
    return ResponseBuilder.createResponse({
      message: 'Report deleted successfully',
      data: null,
    });
  }
}
