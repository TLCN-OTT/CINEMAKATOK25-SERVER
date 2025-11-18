// src/audit-log/audit-log.service.ts
import { EntityVideo } from 'src/cms/entities/video.entity';
import { VideoService } from 'src/cms/services/video.service';

import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateAuditLogDto } from '../dtos/audit-log.dto';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private readonly videoService: VideoService,
  ) {}

  // Hàm này dùng để GHI log (các module khác sẽ gọi hàm này)
  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const newLog = this.auditLogRepository.create(dto);
    return await this.auditLogRepository.save(newLog);
  }

  // Hàm này dùng để XEM log (cho Admin Dashboard)
  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const result = await this.auditLogRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    const total = await this.auditLogRepository.count();
    return { result, total };
  }

  async logVideoAction(userId: string, videoId: string) {
    const video = await this.videoService.getMovieOrSeriesIdFromVideo(videoId);
    if (!video) {
      throw new NotFoundException({
        message: `Video with ID ${videoId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }
    if (video.movieId) {
      await this.log({
        action: LOG_ACTION.PLAY_MOVIE,
        userId,
        description: `User played movie with ID ${video.movieId}`,
      });
    } else if (video.tvSeriesId) {
      await this.log({
        action: LOG_ACTION.PLAY_EPISODE_OF_SERIES,
        userId,
        description: `User played series with ID ${video.tvSeriesId}`,
      });
    }
  }
}
