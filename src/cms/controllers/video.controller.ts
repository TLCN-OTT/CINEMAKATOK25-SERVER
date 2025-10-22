import * as fs from 'fs';
import * as path from 'path';

import { plainToInstance } from 'class-transformer';
import { CookieOptions, Response } from 'express';

import { RESOLUTION, VIDEO_STATUS } from '@app/common/enums/global.enum';
import { IsAdminGuard, JwtAuthGuard } from '@app/common/guards';
import { ApiResponseDto, PaginatedApiResponseDto, ResponseBuilder } from '@app/common/utils/dto';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { QueueService } from '@app/core/queue/queue.service';
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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { multerConfig } from '../config/upload.config';
import { AbsContentPathParams, CreateVideoDto, UpdateVideoDto, VideoDto } from '../dtos/video.dto';
import { S3Service } from '../services/s3.service';
import { VideoService } from '../services/video.service';

@Controller({
  path: 'videos',
  version: '1',
})
@ApiTags('cms / Video')
@ApiBearerAuth()
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly queueService: QueueService,
    private readonly s3Service: S3Service,
  ) {}

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

  @Post('upload')
  // @UseGuards(JwtAuthGuard, IsAdminGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: '[ADMIN] Upload video for HLS encoding' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Video file to upload (MP4, MPEG, MOV, AVI, MKV, WebM)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Video uploaded successfully and queued for processing',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file or file type not supported',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have admin privileges',
  })
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return ResponseBuilder.createResponse({
        data: null,
        message: 'No file uploaded. Please provide a video file.',
      });
    }

    const fileName = path.parse(file.filename).name;

    // 1️⃣ Tạo 3 video entities TRƯỚC với status PROCESSING

    const createdVideo = await this.videoService.create({
      videoUrl: `/uploads/${fileName}/master.m3u8`, // Placeholder path
      status: VIDEO_STATUS.PROCESSING,
    });

    // 2️⃣ Thêm job vào queue với videoId
    const inputPath = file.path;
    const result = await this.queueService.addVideoJob(inputPath, createdVideo.id);

    // 3️⃣ Nếu Redis down → đã xử lý sync và update videos
    if (!result.isQueued && result.video) {
      // Trả về tất cả 3 video variants đã được update
      const videoDto = plainToInstance(VideoDto, result.video, { excludeExtraneousValues: true });

      return ResponseBuilder.createResponse({
        data: {
          video: videoDto,
          videoId: result.videoId ?? null,
          queued: false,
          message: `Processed immediately. Created ${videoDto} video variants.`,
        },
        message: 'Video uploaded and processed successfully',
      });
    }

    // xoa file temp luu o server sau khi da add job vao queue
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Temp file deleted: ${file.path}`);
      }
    } catch (err) {
      console.warn(`⚠️  Failed to delete temp file: ${err.message}`);
    }

    // 4️⃣ Nếu có Redis → video đang được xử lý ở background
    const videoDtos = plainToInstance(VideoDto, createdVideo, { excludeExtraneousValues: true });

    return ResponseBuilder.createResponse({
      data: {
        videos: videoDtos,
        jobId: result.jobId ?? null,
        queued: true,
        message: 'Videos are being processed in background. Use these IDs to check status.',
      },
      message: 'Video uploaded successfully, encoding in background',
    });
  }
  @Get(':s3Key/access')
  async getFileAccess(
    @Param() params: AbsContentPathParams,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { s3Key } = params;

    const result = await this.s3Service.getSignedCookiesForFile(s3Key);

    // set cookies on response
    Object.keys(result.cookies).forEach(key => {
      const curr = result.cookies[key];
      response.cookie(key, curr.value, curr.options ?? {});
    });

    return result;
  }
}
