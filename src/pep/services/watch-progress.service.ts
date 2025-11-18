import { EntityUser } from 'src/auth/entities/user.entity';
import { EntityVideo } from 'src/cms/entities/video.entity';
import { VideoService } from 'src/cms/services/video.service';

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
    private readonly videoService: VideoService,
  ) {}

  /**
   * Create or get existing watch progress for a video
   */
  async updateWatchProgress(userId: string, createDto: CreateWatchProgressDto) {
    // Kiểm tra video tồn tại
    const video = await this.videoService.findOne(createDto.videoId);

    // Tìm watch progress hiện tại
    let watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        video: { id: createDto.videoId },
      },
      relations: ['user', 'video'],
    });

    if (!watchProgress) {
      // Tạo mới
      watchProgress = this.watchProgressRepository.create({
        user: { id: userId } as EntityUser,
        video,
        watchedDuration: createDto.watchedDuration,
        lastWatched: new Date(),
        isCompleted: false,
      });
    } else {
      // Cập nhật
      watchProgress.watchedDuration = createDto.watchedDuration;
      watchProgress.lastWatched = new Date();
    }

    return this.watchProgressRepository.save(watchProgress);
  }

  /**
   * Update watch progress with additional fields
   */
  async updateProgress(userId: string, videoId: string, updateDto: UpdateWatchProgressDto) {
    let watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        video: { id: videoId },
      },
      relations: ['user', 'video'],
    });

    if (!watchProgress) {
      throw new NotFoundException({
        message: `Watch progress for video ${videoId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    if (updateDto.watchedDuration !== undefined) {
      watchProgress.watchedDuration = updateDto.watchedDuration;
    }

    if (updateDto.isCompleted !== undefined) {
      watchProgress.isCompleted = updateDto.isCompleted;
    }

    watchProgress.lastWatched = new Date();

    return this.watchProgressRepository.save(watchProgress);
  }

  /**
   * Get watch progress for a specific video by user
   */
  async getWatchProgress(userId: string, videoId: string) {
    const watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        video: { id: videoId },
      },
      relations: ['user', 'video'],
    });

    if (!watchProgress) {
      throw new NotFoundException({
        message: `Watch progress for video ${videoId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    return watchProgress;
  }

  /**
   * Get resume data for a video (để tiếp tục xem)
   */
  async getResumeData(userId: string, videoId: string) {
    const watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        video: { id: videoId },
      },
      relations: ['video'],
    });

    if (!watchProgress) {
      // Trả về null nếu chưa có watch progress
      return null;
    }

    return {
      videoId: watchProgress.video.id,
      contentTitle: watchProgress.video.videoUrl, // Placeholder, need to get from owner
      contentThumbnail: watchProgress.video.thumbnailUrl,
      watchedDuration: watchProgress.watchedDuration,
      lastWatched: watchProgress.lastWatched,
      isCompleted: watchProgress.isCompleted,
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
      .leftJoinAndSelect('wp.video', 'video')
      .where('wp.user_id = :userId', { userId });

    // Note: Search is not applicable for videos directly, as they don't have titles
    // You might need to join with owner entities if needed

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

    // Enrich data with video information
    const enrichedData = await Promise.all(
      data.map(async item => {
        let duration: number | null = null;
        let movieId: string | null = null;
        let episodeId: string | null = null;
        let contentTitle: string | null = null;
        let contentThumbnail: string | null = null;
        let metadata: Record<string, any> | null = null;

        // Get owner info from video
        try {
          if (item.video.ownerId && item.video.ownerType) {
            const ownerInfo = await this.videoService.getMovieOrSeriesIdFromVideo(item.video.id);
            if (ownerInfo && 'movieId' in ownerInfo && ownerInfo.movieId) {
              movieId = ownerInfo.movieId;
              // Get movie metadata
              const movie = await this.watchProgressRepository.manager
                .createQueryBuilder()
                .select('movie')
                .from('EntityMovie', 'movie')
                .leftJoinAndSelect('movie.metaData', 'metaData')
                .where('movie.id = :movieId', { movieId: ownerInfo.movieId })
                .getOne();
              if (movie) {
                contentTitle = movie.metaData?.title || null;
                contentThumbnail = movie.metaData?.thumbnail || null;
                duration = movie.duration || null;
                metadata = movie.metaData
                  ? {
                      id: movie.metaData.id,
                      title: movie.metaData.title,
                      description: movie.metaData.description,
                      thumbnail: movie.metaData.thumbnail,
                      banner: movie.metaData.banner,
                      trailer: movie.metaData.trailer,
                      type: movie.metaData.type,
                      releaseDate: movie.metaData.releaseDate,
                      avgRating: movie.metaData.avgRating,
                      imdbRating: movie.metaData.imdbRating,
                      maturityRating: movie.metaData.maturityRating,
                      viewCount: movie.metaData.viewCount,
                    }
                  : null;
              }
            } else if (ownerInfo && 'tvSeriesId' in ownerInfo && ownerInfo.tvSeriesId) {
              // For TV series, get series metadata and episode duration if applicable
              const tvSeries = await this.watchProgressRepository.manager
                .createQueryBuilder()
                .select('tvseries')
                .from('EntityTvseries', 'tvseries')
                .leftJoinAndSelect('tvseries.metaData', 'metaData')
                .where('tvseries.id = :tvSeriesId', { tvSeriesId: ownerInfo.tvSeriesId })
                .getOne();
              if (tvSeries) {
                contentTitle = tvSeries.metaData?.title || null;
                contentThumbnail = tvSeries.metaData?.thumbnail || null;
                metadata = tvSeries.metaData
                  ? {
                      id: tvSeries.metaData.id,
                      title: tvSeries.metaData.title,
                      description: tvSeries.metaData.description,
                      thumbnail: tvSeries.metaData.thumbnail,
                      banner: tvSeries.metaData.banner,
                      trailer: tvSeries.metaData.trailer,
                      type: tvSeries.metaData.type,
                      releaseDate: tvSeries.metaData.releaseDate,
                      avgRating: tvSeries.metaData.avgRating,
                      imdbRating: tvSeries.metaData.imdbRating,
                      maturityRating: tvSeries.metaData.maturityRating,
                      viewCount: tvSeries.metaData.viewCount,
                    }
                  : null;
              }
              // Get duration from episode if video is for episode
              if (item.video.ownerType === 'episode' && item.video.ownerId) {
                episodeId = item.video.ownerId;
                const episode = await this.watchProgressRepository.manager
                  .createQueryBuilder()
                  .select('episode')
                  .from('EntityEpisode', 'episode')
                  .where('episode.id = :episodeId', { episodeId: item.video.ownerId })
                  .getOne();
                duration = episode?.episodeDuration || null;
              }
            }
          }
        } catch (error) {
          // Ignore if video not found or error
        }

        return {
          ...item,
          movieId,
          episodeId,
          duration,
          contentTitle,
          contentThumbnail,
          metadata,
        };
      }),
    );

    return { data: enrichedData, total };
  }

  /**
   * Get watch history (các video đã xem)
   */
  async getWatchHistory(userId: string, query: PaginationQueryDto) {
    const { page = 1, limit = 10, sort } = query || {};

    const queryBuilder = this.watchProgressRepository
      .createQueryBuilder('wp')
      .leftJoinAndSelect('wp.video', 'video')
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
   * Get recently watched videos (top 10)
   */
  async getRecentlyWatched(userId: string, limit: number = 10) {
    const watchProgress = await this.watchProgressRepository
      .createQueryBuilder('wp')
      .leftJoinAndSelect('wp.video', 'video')
      .where('wp.user_id = :userId', { userId })
      .andWhere('wp.lastWatched IS NOT NULL')
      .orderBy('wp.lastWatched', 'DESC')
      .take(limit)
      .getMany();

    return watchProgress;
  }

  /**
   * Mark video as completed
   */
  async markAsCompleted(userId: string, videoId: string) {
    const watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        video: { id: videoId },
      },
    });

    if (!watchProgress) {
      throw new NotFoundException({
        message: `Watch progress for video ${videoId} not found`,
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
  async deleteWatchProgress(userId: string, videoId: string) {
    const watchProgress = await this.watchProgressRepository.findOne({
      where: {
        user: { id: userId },
        video: { id: videoId },
      },
    });

    if (!watchProgress) {
      throw new NotFoundException({
        message: `Watch progress for video ${videoId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    await this.watchProgressRepository.delete({
      user: { id: userId },
      video: { id: videoId },
    });

    return { message: 'Watch progress deleted successfully' };
  }
}
