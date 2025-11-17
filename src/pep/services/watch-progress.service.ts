import { EntityUser } from 'src/auth/entities/user.entity';
import { EntityContent } from 'src/cms/entities/content.entity';
import { ContentService } from 'src/cms/services/content.service';

import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  CreateWatchProgressDto,
  UpdateWatchProgressDto,
  WatchProgressDto,
} from '../dtos/watch-progress.dto';
import { EntityWatchProgress } from '../entities/watch-progress.entity';

@Injectable()
export class WatchProgressService {
  constructor(
    @InjectRepository(EntityWatchProgress)
    private readonly watchProgressRepository: Repository<EntityWatchProgress>,
    private readonly contentService: ContentService,
  ) {}

  /**
   * Create or get existing watch progress for a content
   */
  async updateWatchProgress(userId: string, createDto: CreateWatchProgressDto) {
    // Kiểm tra content tồn tại
    const content = await this.contentService.findContentById(createDto.contentId);

    // Tìm watch progress hiện tại
    let watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: createDto.contentId },
      },
      relations: ['user', 'content'],
    });

    if (!watchProgress) {
      // Tạo mới
      watchProgress = this.watchProgressRepository.create({
        user: { id: userId } as EntityUser,
        content,
        watchedDuration: createDto.watchedDuration,
        lastWatched: new Date(),
        episodeId: createDto.episodeId || null,
        isCompleted: false,
      });
    } else {
      // Cập nhật
      watchProgress.watchedDuration = createDto.watchedDuration;
      watchProgress.lastWatched = new Date();
      if (createDto.episodeId) {
        watchProgress.episodeId = createDto.episodeId;
      }
    }

    return this.watchProgressRepository.save(watchProgress);
  }

  /**
   * Update watch progress with additional fields
   */
  async updateProgress(userId: string, contentId: string, updateDto: UpdateWatchProgressDto) {
    let watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
      relations: ['user', 'content'],
    });

    if (!watchProgress) {
      throw new NotFoundException({
        message: `Watch progress for content ${contentId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    if (updateDto.watchedDuration !== undefined) {
      watchProgress.watchedDuration = updateDto.watchedDuration;
    }

    if (updateDto.isCompleted !== undefined) {
      watchProgress.isCompleted = updateDto.isCompleted;
    }

    if (updateDto.episodeId !== undefined) {
      watchProgress.episodeId = updateDto.episodeId;
    }

    watchProgress.lastWatched = new Date();

    return this.watchProgressRepository.save(watchProgress);
  }

  /**
   * Get watch progress for a specific content by user
   */
  async getWatchProgress(userId: string, contentId: string) {
    const watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
      relations: ['user', 'content'],
    });

    if (!watchProgress) {
      throw new NotFoundException({
        message: `Watch progress for content ${contentId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    return watchProgress;
  }

  /**
   * Get resume data for a content (để tiếp tục xem)
   */
  async getResumeData(userId: string, contentId: string) {
    const watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
      relations: ['content'],
    });

    if (!watchProgress) {
      // Trả về null nếu chưa có watch progress
      return null;
    }

    return {
      contentId: watchProgress.content.id,
      contentTitle: watchProgress.content.title,
      contentThumbnail: watchProgress.content.thumbnail,
      watchedDuration: watchProgress.watchedDuration,
      lastWatched: watchProgress.lastWatched,
      isCompleted: watchProgress.isCompleted,
      episodeId: watchProgress.episodeId,
    };
  }

  /**
   * Get all watch progress by user with pagination
   */
  async getWatchProgressByUser(
    userId: string,
    query: PaginationQueryDto & { search?: string; isCompleted?: boolean },
  ) {
    const { page = 1, limit = 10, sort, search, isCompleted } = query || {};

    const queryBuilder = this.watchProgressRepository
      .createQueryBuilder('wp')
      .leftJoinAndSelect('wp.content', 'content')
      .where('wp.user_id = :userId', { userId });

    if (search) {
      queryBuilder.andWhere('content.title ILIKE :search', { search: `%${search}%` });
    }

    if (isCompleted !== undefined) {
      queryBuilder.andWhere('wp.isCompleted = :isCompleted', { isCompleted });
    }

    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      Object.entries(sortObj).forEach(([key, order]) => {
        queryBuilder.addOrderBy(`wp.${key}`, order as 'ASC' | 'DESC');
      });
    } else {
      queryBuilder.orderBy('wp.lastWatched', 'DESC');
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Enrich data with movie/episode information
    const enrichedData = await Promise.all(
      data.map(async item => {
        let duration = null;
        let movieId = null;

        // If episodeId exists, get duration from episode
        if (item.episodeId) {
          const episode = await this.watchProgressRepository.manager
            .createQueryBuilder()
            .select('episode')
            .from('EntityEpisode', 'episode')
            .where('episode.id = :episodeId', { episodeId: item.episodeId })
            .getOne();
          duration = episode?.episodeDuration || null;
        } else {
          // Otherwise, get duration from movie
          const movieEntity = await this.watchProgressRepository.manager
            .createQueryBuilder()
            .select('movie')
            .from('EntityMovie', 'movie')
            .leftJoinAndSelect('movie.metaData', 'metaData')
            .where('metaData.id = :contentId', { contentId: item.content.id })
            .getOne();
          movieId = movieEntity?.id || null;
          duration = movieEntity?.duration || null;
        }

        return {
          ...item,
          movieId,
          duration,
        };
      }),
    );

    return { data: enrichedData, total };
  }

  /**
   * Get watch history (các content đã xem)
   */
  async getWatchHistory(userId: string, query: PaginationQueryDto) {
    const { page = 1, limit = 10, sort } = query || {};

    const queryBuilder = this.watchProgressRepository
      .createQueryBuilder('wp')
      .leftJoinAndSelect('wp.content', 'content')
      .where('wp.user_id = :userId', { userId })
      .andWhere('wp.lastWatched IS NOT NULL');

    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      Object.entries(sortObj).forEach(([key, order]) => {
        queryBuilder.addOrderBy(`wp.${key}`, order as 'ASC' | 'DESC');
      });
    } else {
      queryBuilder.orderBy('wp.lastWatched', 'DESC');
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Get recently watched contents (top 10)
   */
  async getRecentlyWatched(userId: string, limit: number = 10) {
    const watchProgress = await this.watchProgressRepository
      .createQueryBuilder('wp')
      .leftJoinAndSelect('wp.content', 'content')
      .where('wp.user_id = :userId', { userId })
      .andWhere('wp.lastWatched IS NOT NULL')
      .orderBy('wp.lastWatched', 'DESC')
      .take(limit)
      .getMany();

    return watchProgress;
  }

  /**
   * Mark content as completed
   */
  async markAsCompleted(userId: string, contentId: string) {
    const watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
    });

    if (!watchProgress) {
      throw new NotFoundException({
        message: `Watch progress for content ${contentId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    watchProgress.isCompleted = true;
    watchProgress.lastWatched = new Date();

    return this.watchProgressRepository.save(watchProgress);
  }

  /**
   * Delete watch progress
   */
  async deleteWatchProgress(userId: string, contentId: string) {
    const watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
    });

    if (!watchProgress) {
      throw new NotFoundException({
        message: `Watch progress for content ${contentId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    await this.watchProgressRepository.delete({
      user: { id: userId },
      content: { id: contentId },
    });

    return { message: 'Watch progress deleted successfully' };
  }
}
