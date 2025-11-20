// src/audit-log/audit-log.service.ts
import { EntityVideo } from 'src/cms/entities/video.entity';
import { VideoService } from 'src/cms/services/video.service';

import { Repository } from 'typeorm';
import { MoreThanOrEqual, Not } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityUser } from '../../auth/entities/user.entity';
import { CreateAuditLogDto } from '../dtos/audit-log.dto';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(EntityUser)
    private userRepository: Repository<EntityUser>,
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

  // Hàm này dùng để lấy recent activity từ 7 ngày vừa qua
  async getRecentActivity(query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    console.log('Seven days ago:', sevenDaysAgo);

    // First get the audit logs
    const logs = await this.auditLogRepository
      .createQueryBuilder('log')
      .select(['log.id', 'log.userId', 'log.action', 'log.description', 'log.createdAt'])
      .where('log.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('log.createdAt <= :now', { now: new Date() })
      .andWhere('log.action != :excludedAction', {
        excludedAction: LOG_ACTION.CONTENT_VIEW_INCREASED,
      })
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany();

    const total = await this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('log.createdAt <= :now', { now: new Date() })
      .andWhere('log.action != :excludedAction', {
        excludedAction: LOG_ACTION.CONTENT_VIEW_INCREASED,
      })
      .getCount();

    // Get unique user IDs
    const userIds = [...new Set(logs.map(log => log.log_userId))];

    // Get user names
    const users = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name'])
      .where('user.id IN (:...userIds)', { userIds })
      .getRawMany();

    // Create user name map
    const userNameMap = new Map(users.map(user => [user.user_id, user.user_name]));

    // Map user names to logs and sort by createdAt DESC (though query already sorts)
    const resultWithUserNames = logs
      .map(log => ({
        id: log.log_id,
        userId: log.log_userId,
        action: log.log_action,
        description: log.log_description,
        createdAt: log.log_createdAt,
        userName: userNameMap.get(log.log_userId) || 'Unknown User',
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { result: resultWithUserNames, total };
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
