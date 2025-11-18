import { AuditLogService } from 'src/audit-log/service/audit-log.service';
import { ContentType, EntityContent } from 'src/cms/entities/content.entity';
import { ContentService } from 'src/cms/services/content.service';

import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityWatchList } from '../entities/watchlist.entity';

@Injectable()
export class WatchListService {
  constructor(
    @InjectRepository(EntityWatchList)
    private readonly watchListRepository: Repository<EntityWatchList>,
    @InjectRepository(EntityContent)
    private readonly contentRepository: Repository<EntityContent>,
    private readonly auditLogService: AuditLogService,
    private readonly contentService: ContentService,
  ) {}

  /**
   * Add content to user's watchlist
   */
  async addToWatchList(userId: string, contentId: string): Promise<EntityWatchList> {
    // Check if content exists
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException({
        message: `Content with ID ${contentId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    // Check if already in watchlist
    const existing = await this.watchListRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
    });

    if (existing) {
      throw new ConflictException({
        message: 'Content already in watchlist',
        code: ERROR_CODE.ALREADY_EXISTS,
      });
    }

    // Create watchlist entry
    const watchListItem = this.watchListRepository.create({
      user: { id: userId } as any,
      content: { id: contentId } as any,
    });
    await this.logWatchListAction(
      userId,
      content,
      content.type === ContentType.MOVIE
        ? LOG_ACTION.ADD_MOVIE_TO_WATCHLIST
        : LOG_ACTION.ADD_SERIES_TO_WATCHLIST,
    );

    return await this.watchListRepository.save(watchListItem);
  }

  /**
   * Remove content from user's watchlist
   */
  async removeFromWatchList(userId: string, contentId: string): Promise<void> {
    const watchListItem = await this.watchListRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
    });

    if (!watchListItem) {
      throw new NotFoundException({
        message: 'Content not found in watchlist',
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }
    await this.logWatchListAction(
      userId,
      watchListItem.content,
      watchListItem.content.type === ContentType.MOVIE
        ? LOG_ACTION.REMOVE_MOVIE_FROM_WATCHLIST
        : LOG_ACTION.REMOVE_SERIES_FROM_WATCHLIST,
    );

    await this.watchListRepository.remove(watchListItem);
  }

  /**
   * Get user's watchlist with content details
   */
  async getUserWatchList(userId: string, query?: any): Promise<any> {
    const { page = 1, limit = 10 } = query || {};

    const queryBuilder = this.watchListRepository
      .createQueryBuilder('watchlist')
      .leftJoinAndSelect('watchlist.content', 'content')
      .leftJoinAndSelect('content.categories', 'category')
      .where('watchlist.user_id = :userId', { userId })
      .orderBy('watchlist.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    // Get movie/tvseries IDs for each content
    if (data.length > 0) {
      const contentIds = data.map(item => item.content.id);

      // Query movies
      const movies = await this.watchListRepository.manager
        .createQueryBuilder()
        .select('movie.id', 'movieId')
        .addSelect('movie.content_id', 'contentId')
        .addSelect('movie.duration', 'duration')
        .from('movies', 'movie')
        .where('movie.content_id IN (:...contentIds)', { contentIds })
        .getRawMany();

      // Query tvseries
      const tvseries = await this.watchListRepository.manager
        .createQueryBuilder()
        .select('tvseries.id', 'tvseriesId')
        .addSelect('tvseries.content_id', 'contentId')
        .from('tvseries', 'tvseries')
        .where('tvseries.content_id IN (:...contentIds)', { contentIds })
        .getRawMany();

      // Create lookup maps
      const movieMap = new Map(movies.map(m => [m.contentId, m.movieId]));
      const tvseriesMap = new Map(tvseries.map(t => [t.contentId, t.tvseriesId]));

      // Transform data
      const transformedData = data.map(item => ({
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        content: {
          id:
            item.content.type === 'MOVIE'
              ? movieMap.get(item.content.id)
              : tvseriesMap.get(item.content.id),
          contentId: item.content.id,
          type: item.content.type,
          title: item.content.title,
          description: item.content.description,
          thumbnail: item.content.thumbnail,
          releaseDate: item.content.releaseDate,
          trailer: item.content.trailer,
          maturityRating: item.content.maturityRating,
          categories: item.content.categories?.map(cat => cat.categoryName) || [],
          duration:
            item.content.type === 'MOVIE'
              ? movies.find(m => m.contentId === item.content.id)?.duration
              : 0,
        },
      }));

      return { data: transformedData, total };
    }

    return { data: [], total: 0 };
  }

  /**
   * Check if content is in user's watchlist
   */
  async isInWatchList(userId: string, contentId: string): Promise<boolean> {
    const count = await this.watchListRepository.count({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
    });

    return count > 0;
  }

  /**
   * Check if movie/tvseries is in user's watchlist by movie/tvseries ID
   */
  async isInWatchListByMovieId(
    userId: string,
    movieOrSeriesId: string,
    type: 'MOVIE' | 'TVSERIES',
  ): Promise<boolean> {
    // Get content ID from movie/tvseries ID
    const tableName = type === 'MOVIE' ? 'movies' : 'tvseries';

    const result = await this.watchListRepository.manager
      .createQueryBuilder()
      .select('item.content_id', 'contentId')
      .from(tableName, 'item')
      .where('item.id = :movieOrSeriesId', { movieOrSeriesId })
      .getRawOne();

    if (!result) {
      return false;
    }

    return await this.isInWatchList(userId, result.contentId);
  }

  /**
   * Get count of users who added content to their watchlist (favourites)
   */
  async getFavouriteCount(contentId: string): Promise<number> {
    const count = await this.watchListRepository.count({
      where: {
        content: { id: contentId },
      },
    });

    return count;
  }

  private async logWatchListAction(
    userId: string,
    content: any,
    action:
      | LOG_ACTION.ADD_MOVIE_TO_WATCHLIST
      | LOG_ACTION.ADD_SERIES_TO_WATCHLIST
      | LOG_ACTION.REMOVE_MOVIE_FROM_WATCHLIST
      | LOG_ACTION.REMOVE_SERIES_FROM_WATCHLIST,
  ) {
    const isMovie = content.type === ContentType.MOVIE;
    const contentId = await this.contentService.getIdOfTVOrMovie(content.id);
    const typeText = isMovie ? 'movie' : 'TV series';

    await this.auditLogService.log({
      action,
      userId,
      description: `User ${userId} ${action === LOG_ACTION.ADD_MOVIE_TO_WATCHLIST || action === LOG_ACTION.ADD_SERIES_TO_WATCHLIST ? 'added' : 'removed'} ${typeText} with ID ${contentId}`,
    });
  }
}
