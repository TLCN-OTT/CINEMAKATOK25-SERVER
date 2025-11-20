import { Brackets, Repository } from 'typeorm';

import { LOG_ACTION } from '@app/common/enums/log.enum';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AuditLog } from '../../audit-log/entities/audit-log.entity';
import { EntityWatchProgress } from '../../pep/entities/watch-progress.entity';
import {
  ChurnRateMetricDto,
  DAUMetricDto,
  MAUMetricDto,
  PaginatedTrendingDataDto,
  PaginatedViewStatsDto,
  TrendingDataWithPaginationDto,
  TrendingItemDto,
  UserMetricsDto,
  UserStatsDto,
  UserSummaryDto,
  ViewStatsDto,
  ViewStatsItemDto,
} from '../dtos/analytics.dto';
import { EntityCategory } from '../entities/category.entity';
import { EntityMovie } from '../entities/movie.entity';
import { EntityTVSeries } from '../entities/tvseries.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(EntityMovie)
    private movieRepository: Repository<EntityMovie>,
    @InjectRepository(EntityTVSeries)
    private tvseriesRepository: Repository<EntityTVSeries>,
    @InjectRepository(EntityCategory)
    private categoryRepository: Repository<EntityCategory>,
    @InjectRepository(EntityWatchProgress)
    private watchProgressRepository: Repository<EntityWatchProgress>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  private parseChangeToNumber(change: string): number {
    // Parse change string like "+66.7%" or "-50.0%" to number
    const match = change.match(/([+-]?\d+\.?\d*)%/);
    return match ? parseFloat(match[1]) : 0;
  }

  private async calculateEngagement(contentId: string): Promise<number> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Count engagement actions for this content in last 7 days
      const engagementActions = [
        LOG_ACTION.LIKE_MOVIE,
        LOG_ACTION.UNLIKE_MOVIE,
        LOG_ACTION.ADD_MOVIE_TO_WATCHLIST,
        LOG_ACTION.REMOVE_MOVIE_FROM_WATCHLIST,
        LOG_ACTION.PLAY_MOVIE,
        LOG_ACTION.LIKE_SERIES,
        LOG_ACTION.UNLIKE_SERIES,
        LOG_ACTION.ADD_SERIES_TO_WATCHLIST,
        LOG_ACTION.REMOVE_SERIES_FROM_WATCHLIST,
        LOG_ACTION.PLAY_EPISODE_OF_SERIES,
        LOG_ACTION.CREATE_REVIEW,
        LOG_ACTION.UPDATE_REVIEW,
        LOG_ACTION.DELETE_REVIEW,
        LOG_ACTION.CONTENT_VIEW_INCREASED,
      ];

      const contentEngagementCount = await this.auditLogRepository
        .createQueryBuilder('log')
        .where('log.action IN (:...engagementActions)', { engagementActions })
        .andWhere('log.description LIKE :contentId', { contentId: `%${contentId}%` })
        .andWhere('log.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getCount();

      // Calculate total engagement across all content in the last 7 days
      const totalEngagementCount = await this.auditLogRepository
        .createQueryBuilder('log')
        .where('log.action IN (:...engagementActions)', { engagementActions })
        .andWhere('log.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getCount();

      // Calculate engagement score as percentage of total engagement
      const engagementScore =
        totalEngagementCount > 0 ? (contentEngagementCount / totalEngagementCount) * 100 : 0;

      return Math.round(engagementScore);
    } catch (error) {
      console.error('Error calculating engagement:', error);
      return 0;
    }
  }

  private async calculateTrending(
    contentId: string,
    contentType: 'movie' | 'tvseries',
  ): Promise<{ trending: 'up' | 'down'; change: string }> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Count CONTENT_VIEW_INCREASED logs in last 7 days for this content
      const recentViews = await this.auditLogRepository
        .createQueryBuilder('log')
        .where('log.action = :action', { action: LOG_ACTION.CONTENT_VIEW_INCREASED })
        .andWhere('log.description LIKE :contentId', { contentId: `%${contentId}%` })
        .andWhere('log.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getCount();

      // Count CONTENT_VIEW_INCREASED logs in previous 7 days (8-14 days ago)
      const previousViews = await this.auditLogRepository
        .createQueryBuilder('log')
        .where('log.action = :action', { action: LOG_ACTION.CONTENT_VIEW_INCREASED })
        .andWhere('log.description LIKE :contentId', { contentId: `%${contentId}%` })
        .andWhere('log.createdAt >= :fourteenDaysAgo', { fourteenDaysAgo })
        .andWhere('log.createdAt < :sevenDaysAgo', { sevenDaysAgo })
        .getCount();
      // Calculate change percentage
      let changePercent = 0;
      if (previousViews > 0) {
        changePercent = ((recentViews - previousViews) / previousViews) * 100;
      } else if (recentViews > 0) {
        changePercent = 0; // New content: no previous data, no special priority
      }

      const trending = changePercent >= 0 ? 'up' : 'down';
      const change = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`;

      return { trending, change };
    } catch (error) {
      console.error('Error calculating trending:', error);
      return { trending: 'up', change: '+0.0%' };
    }
  }

  private async calculateCategoryTrending(
    categoryId: string,
  ): Promise<{ trending: 'up' | 'down'; change: string }> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Get all content IDs in this category
      const categoryContents = await this.categoryRepository.findOne({
        where: { id: categoryId },
        relations: ['contents'],
      });

      if (!categoryContents?.contents?.length) {
        return { trending: 'up', change: '+0.0%' };
      }

      const contentIds = categoryContents.contents.map(c => c.id);

      // Count CONTENT_VIEW_INCREASED logs in last 7 days for all contents in this category
      const recentViews = await this.auditLogRepository
        .createQueryBuilder('log')
        .where('log.action = :action', { action: LOG_ACTION.CONTENT_VIEW_INCREASED })
        .andWhere(
          new Brackets(qb => {
            contentIds.forEach((contentId, index) => {
              const paramName = `contentId${index}`;
              if (index === 0) {
                qb.where(`log.description LIKE :${paramName}`, { [paramName]: `%${contentId}%` });
              } else {
                qb.orWhere(`log.description LIKE :${paramName}`, { [paramName]: `%${contentId}%` });
              }
            });
          }),
        )
        .andWhere('log.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getCount();

      // Count CONTENT_VIEW_INCREASED logs in previous 7 days for all contents in this category
      const previousViews = await this.auditLogRepository
        .createQueryBuilder('log')
        .where('log.action = :action', { action: LOG_ACTION.CONTENT_VIEW_INCREASED })
        .andWhere(
          new Brackets(qb => {
            contentIds.forEach((contentId, index) => {
              const paramName = `contentId${index}`;
              if (index === 0) {
                qb.where(`log.description LIKE :${paramName}`, { [paramName]: `%${contentId}%` });
              } else {
                qb.orWhere(`log.description LIKE :${paramName}`, { [paramName]: `%${contentId}%` });
              }
            });
          }),
        )
        .andWhere('log.createdAt >= :fourteenDaysAgo', { fourteenDaysAgo })
        .andWhere('log.createdAt < :sevenDaysAgo', { sevenDaysAgo })
        .getCount();

      // Calculate change percentage
      let changePercent = 0;
      if (previousViews > 0) {
        changePercent = ((recentViews - previousViews) / previousViews) * 100;
      } else if (recentViews > 0) {
        changePercent = 0; // New content: no previous data, no special priority
      }

      const trending = changePercent >= 0 ? 'up' : 'down';
      const change = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`;

      return { trending, change };
    } catch (error) {
      console.error('Error calculating category trending:', error);
      return { trending: 'up', change: '+0.0%' };
    }
  }

  async getMoviesStats(
    query: PaginationQueryDto,
  ): Promise<{ data: ViewStatsItemDto[]; total: number }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;

      // Build query builder similar to movie service
      const qb = this.movieRepository
        .createQueryBuilder('movie')
        .leftJoinAndSelect('movie.metaData', 'metaData')
        .leftJoinAndSelect('metaData.categories', 'categories');

      // Handle search similar to movie service
      if (query.search) {
        const searchObj =
          typeof query.search === 'string' ? JSON.parse(query.search) : query.search;
        const conditions: string[] = [];
        const params: Record<string, any> = {};

        Object.entries(searchObj).forEach(([key, value]) => {
          const field = key.includes('.') ? key : `metaData.${key}`;

          if (['title', 'description'].includes(key)) {
            // ✅ Tìm kiếm không phân biệt hoa thường + chuỗi con + similarity để xếp hạng
            conditions.push(
              `(LOWER(${field}) LIKE LOWER(:${key}) OR similarity(LOWER(${field}), LOWER(:${key})) > 0.2)`,
            );
            params[key] = `%${value}%`;
          } else if (key === 'releaseDate') {
            // ✅ Tìm theo năm
            conditions.push(`EXTRACT(YEAR FROM ${field}) = :${key}`);
            params[key] = value;
          } else {
            // ✅ fallback cho các field khác (so sánh chính xác)
            conditions.push(`${field} = :${key}`);
            params[key] = value;
          }
        });

        if (conditions.length > 0) {
          qb.where(conditions.join(' OR '))
            .setParameters(params)
            .addSelect(
              `GREATEST(${
                Object.keys(searchObj)
                  .filter(k => ['title', 'description'].includes(k))
                  .map(k => `similarity(LOWER(metaData.${k}), LOWER(:${k}))`)
                  .join(', ') || '0'
              })`,
              'rank',
            )
            .orderBy('rank', 'DESC');
        }
      }

      // Get ALL results first (no pagination yet)
      const [allMovies, totalItems] = await qb.getManyAndCount();

      const movieStats: ViewStatsItemDto[] = [];

      // Calculate change for all movies
      for (const movie of allMovies) {
        const views = movie.metaData?.viewCount || 0;
        const { trending, change } = await this.calculateTrending(movie.metaData.id, 'movie');

        movieStats.push({
          id: movie.id,
          title: movie.metaData?.title || 'Unknown',
          views: views,
          trending,
          change,
          percentage: 0,
        });
      }

      // Sort by change descending (highest trending first) if no custom sort
      if (!query.sort && !query.search) {
        movieStats.sort(
          (a, b) => this.parseChangeToNumber(b.change) - this.parseChangeToNumber(a.change),
        );
      } else if (query.sort) {
        // Handle custom sort by other fields
        const sortObj = typeof query.sort === 'string' ? JSON.parse(query.sort) : query.sort;
        const sortKey = Object.keys(sortObj)[0];
        const sortOrder = sortObj[sortKey];

        if (sortKey === 'change') {
          movieStats.sort((a, b) => {
            const diff = this.parseChangeToNumber(b.change) - this.parseChangeToNumber(a.change);
            return sortOrder === 'DESC' ? diff : -diff;
          });
        } else if (sortKey === 'views') {
          movieStats.sort((a, b) => {
            const diff = b.views - a.views;
            return sortOrder === 'DESC' ? diff : -diff;
          });
        } else if (sortKey === 'title') {
          movieStats.sort((a, b) => {
            const titleA = a.title || '';
            const titleB = b.title || '';
            const diff = titleA.localeCompare(titleB);
            return sortOrder === 'DESC' ? -diff : diff;
          });
        }
        // Add more sort fields as needed
      }

      // Apply pagination after sorting
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMovies = movieStats.slice(startIndex, endIndex);

      // Calculate percentages based on current page results
      const totalViews = paginatedMovies.reduce((sum, m) => sum + m.views, 0);
      paginatedMovies.forEach(
        m => (m.percentage = totalViews > 0 ? Math.round((m.views / totalViews) * 100) : 0),
      );

      return { data: paginatedMovies, total: totalItems };
    } catch (error) {
      console.error('Analytics movies error:', error);
      throw error;
    }
  }

  async getTVSeriesStats(
    query: PaginationQueryDto,
  ): Promise<{ data: ViewStatsItemDto[]; total: number }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      // Build query builder similar to movie service
      const qb = this.tvseriesRepository
        .createQueryBuilder('tvseries')
        .leftJoinAndSelect('tvseries.metaData', 'metaData')
        .leftJoinAndSelect('metaData.categories', 'categories');

      // Handle search similar to movie service
      if (query.search) {
        const searchObj =
          typeof query.search === 'string' ? JSON.parse(query.search) : query.search;
        const conditions: string[] = [];
        const params: Record<string, any> = {};

        Object.entries(searchObj).forEach(([key, value]) => {
          const field = key.includes('.') ? key : `metaData.${key}`;

          if (['title', 'description'].includes(key)) {
            // ✅ Tìm kiếm không phân biệt hoa thường + chuỗi con + similarity để xếp hạng
            conditions.push(
              `(LOWER(${field}) LIKE LOWER(:${key}) OR similarity(LOWER(${field}), LOWER(:${key})) > 0.2)`,
            );
            params[key] = `%${value}%`;
          } else if (key === 'releaseDate') {
            // ✅ Tìm theo năm
            conditions.push(`EXTRACT(YEAR FROM ${field}) = :${key}`);
            params[key] = value;
          } else {
            // ✅ fallback cho các field khác (so sánh chính xác)
            conditions.push(`${field} = :${key}`);
            params[key] = value;
          }
        });

        if (conditions.length > 0) {
          qb.where(conditions.join(' OR '))
            .setParameters(params)
            .addSelect(
              `GREATEST(${
                Object.keys(searchObj)
                  .filter(k => ['title', 'description'].includes(k))
                  .map(k => `similarity(LOWER(metaData.${k}), LOWER(:${k}))`)
                  .join(', ') || '0'
              })`,
              'rank',
            )
            .orderBy('rank', 'DESC');
        }
      }

      // Get ALL results first (no pagination yet)
      const [allTVSeries, totalItems] = await qb.getManyAndCount();

      const tvStats: ViewStatsItemDto[] = [];

      // Calculate change for all TV series
      for (const series of allTVSeries) {
        const views = series.metaData?.viewCount || 0;
        const { trending, change } = await this.calculateTrending(series.metaData.id, 'tvseries');

        tvStats.push({
          id: series.id,
          title: series.metaData?.title || 'Unknown',
          views: views,
          trending,
          change,
          percentage: 0,
        });
      }

      // Sort by change descending (highest trending first) if no custom sort
      if (!query.sort && !query.search) {
        tvStats.sort(
          (a, b) => this.parseChangeToNumber(b.change) - this.parseChangeToNumber(a.change),
        );
      } else if (query.sort) {
        // Handle custom sort by other fields
        const sortObj = typeof query.sort === 'string' ? JSON.parse(query.sort) : query.sort;
        const sortKey = Object.keys(sortObj)[0];
        const sortOrder = sortObj[sortKey];

        if (sortKey === 'change') {
          tvStats.sort((a, b) => {
            const diff = this.parseChangeToNumber(b.change) - this.parseChangeToNumber(a.change);
            return sortOrder === 'DESC' ? diff : -diff;
          });
        } else if (sortKey === 'views') {
          tvStats.sort((a, b) => {
            const diff = b.views - a.views;
            return sortOrder === 'DESC' ? diff : -diff;
          });
        } else if (sortKey === 'title') {
          tvStats.sort((a, b) => {
            const titleA = a.title || '';
            const titleB = b.title || '';
            const diff = titleA.localeCompare(titleB);
            return sortOrder === 'DESC' ? -diff : diff;
          });
        }
        // Add more sort fields as needed
      }

      // Apply pagination after sorting
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTVSeries = tvStats.slice(startIndex, endIndex);

      // Calculate percentages based on current page results
      const totalViews = paginatedTVSeries.reduce((sum, t) => sum + t.views, 0);
      paginatedTVSeries.forEach(
        t => (t.percentage = totalViews > 0 ? Math.round((t.views / totalViews) * 100) : 0),
      );

      return { data: paginatedTVSeries, total: totalItems };
    } catch (error) {
      console.error('Analytics TV series error:', error);
      throw error;
    }
  }

  async getCategoriesStats(
    query: PaginationQueryDto,
  ): Promise<{ data: ViewStatsItemDto[]; total: number }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      // Build query builder for categories
      const qb = this.categoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.contents', 'contents');

      // Handle search
      if (query.search) {
        const searchObj =
          typeof query.search === 'string' ? JSON.parse(query.search) : query.search;
        const conditions: string[] = [];
        const params: Record<string, any> = {};

        Object.entries(searchObj).forEach(([key, value]) => {
          const field = key.includes('.') ? key : `category.${key}`;

          if (['categoryName', 'description'].includes(key)) {
            // ✅ Tìm kiếm không phân biệt hoa thường + chuỗi con + similarity để xếp hạng
            conditions.push(
              `(LOWER(${field}) LIKE LOWER(:${key}) OR similarity(LOWER(${field}), LOWER(:${key})) > 0.2)`,
            );
            params[key] = `%${value}%`;
          } else {
            // ✅ fallback cho các field khác (so sánh chính xác)
            conditions.push(`${field} = :${key}`);
            params[key] = value;
          }
        });

        if (conditions.length > 0) {
          qb.where(conditions.join(' OR '))
            .setParameters(params)
            .addSelect(
              `GREATEST(${
                Object.keys(searchObj)
                  .filter(k => ['categoryName', 'description'].includes(k))
                  .map(k => `similarity(LOWER(category.${k}), LOWER(:${k}))`)
                  .join(', ') || '0'
              })`,
              'rank',
            )
            .orderBy('rank', 'DESC');
        }
      }

      // Get ALL results first (no pagination yet)
      const [allCategories, totalItems] = await qb.getManyAndCount();
      const categoryStats: ViewStatsItemDto[] = [];

      // Calculate change for all categories
      for (const category of allCategories) {
        const views =
          category.contents?.reduce((sum, content) => sum + (content.viewCount || 0), 0) || 0;
        const { trending, change } = await this.calculateCategoryTrending(category.id);

        categoryStats.push({
          id: category.id,
          title: category.categoryName,
          views: views,
          trending,
          change,
          percentage: 0,
        });
      }

      // Sort by change descending (highest trending first) if no custom sort
      if (!query.sort && !query.search) {
        categoryStats.sort(
          (a, b) => this.parseChangeToNumber(b.change) - this.parseChangeToNumber(a.change),
        );
      } else if (query.sort) {
        // Handle custom sort by other fields
        const sortObj = typeof query.sort === 'string' ? JSON.parse(query.sort) : query.sort;
        const sortKey = Object.keys(sortObj)[0];
        const sortOrder = sortObj[sortKey];

        if (sortKey === 'change') {
          categoryStats.sort((a, b) => {
            const diff = this.parseChangeToNumber(b.change) - this.parseChangeToNumber(a.change);
            return sortOrder === 'DESC' ? diff : -diff;
          });
        } else if (sortKey === 'views') {
          categoryStats.sort((a, b) => {
            const diff = b.views - a.views;
            return sortOrder === 'DESC' ? diff : -diff;
          });
        } else if (sortKey === 'title') {
          categoryStats.sort((a, b) => {
            const titleA = a.title || '';
            const titleB = b.title || '';
            const diff = titleA.localeCompare(titleB);
            return sortOrder === 'DESC' ? -diff : diff;
          });
        }
        // Add more sort fields as needed
      }

      // Apply pagination after sorting
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCategories = categoryStats.slice(startIndex, endIndex);

      // Calculate percentages based on current page results
      const totalViews = paginatedCategories.reduce((sum, c) => sum + c.views, 0);
      paginatedCategories.forEach(
        c => (c.percentage = totalViews > 0 ? Math.round((c.views / totalViews) * 100) : 0),
      );

      return { data: paginatedCategories, total: totalItems };
    } catch (error) {
      console.error('Analytics categories error:', error);
      throw error;
    }
  }

  async getTrendingMovies(
    query: PaginationQueryDto,
  ): Promise<{ data: TrendingItemDto[]; total: number }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      console.log(`Analytics: Fetching trending movies - page ${page}, limit ${limit}`);

      // Get ALL movies first (no limit)
      const moviesQuery = this.movieRepository
        .createQueryBuilder('movie')
        .leftJoinAndSelect('movie.metaData', 'metaData');

      const allMovies = await moviesQuery.getMany();

      // Calculate trending data for all movies
      const moviesWithTrending: (TrendingItemDto & {
        changeScore: number;
        engagementScore: number;
      })[] = [];
      for (const movie of allMovies) {
        const views = movie.metaData?.viewCount || 0;
        const rating = movie.metaData?.avgRating || 0;
        const { trending, change } = await this.calculateTrending(movie.metaData.id, 'movie');
        const engagement = await this.calculateEngagement(movie.metaData.id);

        const changeScore = this.parseChangeToNumber(change);
        const engagementScore = engagement;

        moviesWithTrending.push({
          id: movie.id,
          title: movie.metaData?.title || 'Unknown',
          poster: movie.metaData?.thumbnail || 'https://via.placeholder.com/50x75?text=Movie',
          rating: rating,
          views: views,
          trend: trending,
          change: change,
          engagement: engagement,
          changeScore,
          engagementScore,
        });
      }

      // Handle search for movies
      let filteredMovies = moviesWithTrending;
      if (query.search) {
        const searchObj =
          typeof query.search === 'string' ? JSON.parse(query.search) : query.search;

        filteredMovies = moviesWithTrending.filter(item => {
          return Object.entries(searchObj).some(([key, value]) => {
            if (['title'].includes(key)) {
              return item.title.toLowerCase().includes((value as string).toLowerCase());
            }
            return false;
          });
        });
      }

      // Sort movies by combined score: change + engagement (default)
      if (!query.sort && !query.search) {
        filteredMovies.sort((a, b) => {
          const scoreA = a.changeScore + a.engagementScore;
          const scoreB = b.changeScore + b.engagementScore;
          return scoreB - scoreA; // Descending order
        });
      } else if (query.sort) {
        // Handle custom sort by other fields
        const sortObj = typeof query.sort === 'string' ? JSON.parse(query.sort) : query.sort;
        const sortKey = Object.keys(sortObj)[0];
        const sortOrder = sortObj[sortKey];

        if (sortKey === 'change') {
          filteredMovies.sort((a, b) => {
            const diff = a.changeScore - b.changeScore;
            return sortOrder === 'DESC' ? -diff : diff;
          });
        } else if (sortKey === 'engagement') {
          filteredMovies.sort((a, b) => {
            const diff = a.engagementScore - b.engagementScore;
            return sortOrder === 'DESC' ? -diff : diff;
          });
        } else if (sortKey === 'views') {
          filteredMovies.sort((a, b) => {
            const diff = a.views - b.views;
            return sortOrder === 'DESC' ? -diff : diff;
          });
        } else if (sortKey === 'rating') {
          filteredMovies.sort((a, b) => {
            const diff = a.rating - b.rating;
            return sortOrder === 'DESC' ? -diff : diff;
          });
        } else if (sortKey === 'title') {
          filteredMovies.sort((a, b) => {
            const diff = a.title.localeCompare(b.title);
            return sortOrder === 'DESC' ? -diff : diff;
          });
        }
      }

      // Apply pagination to movies
      const moviesStartIndex = (page - 1) * limit;
      const moviesEndIndex = moviesStartIndex + limit;
      const paginatedMovies = filteredMovies.slice(moviesStartIndex, moviesEndIndex);

      // Remove internal fields and return clean movies data
      const cleanMoviesData = paginatedMovies.map(
        ({ changeScore, engagementScore, ...item }) => item,
      );

      return { data: cleanMoviesData, total: filteredMovies.length };
    } catch (error) {
      console.error('Analytics trending movies error:', error);
      throw error;
    }
  }

  async getTrendingTVSeries(
    query: PaginationQueryDto,
  ): Promise<{ data: TrendingItemDto[]; total: number }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      console.log(`Analytics: Fetching trending TV series - page ${page}, limit ${limit}`);

      // Get ALL TV series first (no limit)
      const tvSeriesQuery = this.tvseriesRepository
        .createQueryBuilder('tvseries')
        .leftJoinAndSelect('tvseries.metaData', 'metaData');

      const allTVSeries = await tvSeriesQuery.getMany();

      // Calculate trending data for all TV series
      const tvSeriesWithTrending: (TrendingItemDto & {
        changeScore: number;
        engagementScore: number;
      })[] = [];
      for (const series of allTVSeries) {
        const views = series.metaData?.viewCount || 0;
        const rating = series.metaData?.avgRating || 0;
        const { trending, change } = await this.calculateTrending(series.metaData.id, 'tvseries');
        const engagement = await this.calculateEngagement(series.metaData.id);

        const changeScore = this.parseChangeToNumber(change);
        const engagementScore = engagement;

        tvSeriesWithTrending.push({
          id: series.id,
          title: series.metaData?.title || 'Unknown',
          poster: series.metaData?.thumbnail || 'https://via.placeholder.com/50x75?text=TV',
          rating: rating,
          views: views,
          trend: trending,
          change: change,
          engagement: engagement,
          changeScore,
          engagementScore,
        });
      }

      // Handle search for TV series
      let filteredTVSeries = tvSeriesWithTrending;
      if (query.search) {
        const searchObj =
          typeof query.search === 'string' ? JSON.parse(query.search) : query.search;

        filteredTVSeries = tvSeriesWithTrending.filter(item => {
          return Object.entries(searchObj).some(([key, value]) => {
            if (['title'].includes(key)) {
              return item.title.toLowerCase().includes((value as string).toLowerCase());
            }
            return false;
          });
        });
      }

      // Sort TV series by combined score: change + engagement (default)
      if (!query.sort && !query.search) {
        filteredTVSeries.sort((a, b) => {
          const scoreA = a.changeScore + a.engagementScore;
          const scoreB = b.changeScore + b.engagementScore;
          return scoreB - scoreA; // Descending order
        });
      } else if (query.sort) {
        // Handle custom sort by other fields
        const sortObj = typeof query.sort === 'string' ? JSON.parse(query.sort) : query.sort;
        const sortKey = Object.keys(sortObj)[0];
        const sortOrder = sortObj[sortKey];

        if (sortKey === 'change') {
          filteredTVSeries.sort((a, b) => {
            const diff = a.changeScore - b.changeScore;
            return sortOrder === 'DESC' ? -diff : diff;
          });
        } else if (sortKey === 'engagement') {
          filteredTVSeries.sort((a, b) => {
            const diff = a.engagementScore - b.engagementScore;
            return sortOrder === 'DESC' ? -diff : diff;
          });
        } else if (sortKey === 'views') {
          filteredTVSeries.sort((a, b) => {
            const diff = a.views - b.views;
            return sortOrder === 'DESC' ? -diff : diff;
          });
        } else if (sortKey === 'rating') {
          filteredTVSeries.sort((a, b) => {
            const diff = a.rating - b.rating;
            return sortOrder === 'DESC' ? -diff : diff;
          });
        } else if (sortKey === 'title') {
          filteredTVSeries.sort((a, b) => {
            const diff = a.title.localeCompare(b.title);
            return sortOrder === 'DESC' ? -diff : diff;
          });
        }
      }

      // Apply pagination to TV series
      const tvSeriesStartIndex = (page - 1) * limit;
      const tvSeriesEndIndex = tvSeriesStartIndex + limit;
      const paginatedTVSeries = filteredTVSeries.slice(tvSeriesStartIndex, tvSeriesEndIndex);

      // Remove internal fields and return clean TV series data
      const cleanTVSeriesData = paginatedTVSeries.map(
        ({ changeScore, engagementScore, ...item }) => item,
      );

      return { data: cleanTVSeriesData, total: filteredTVSeries.length };
    } catch (error) {
      console.error('Analytics trending TV series error:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserStatsDto> {
    try {
      // Define engagement actions for active users
      const engagementActions = [
        LOG_ACTION.USER_LOGIN,
        LOG_ACTION.LIKE_MOVIE,
        LOG_ACTION.UNLIKE_MOVIE,
        LOG_ACTION.ADD_MOVIE_TO_WATCHLIST,
        LOG_ACTION.REMOVE_MOVIE_FROM_WATCHLIST,
        LOG_ACTION.PLAY_MOVIE,
        LOG_ACTION.LIKE_SERIES,
        LOG_ACTION.UNLIKE_SERIES,
        LOG_ACTION.ADD_SERIES_TO_WATCHLIST,
        LOG_ACTION.REMOVE_SERIES_FROM_WATCHLIST,
        LOG_ACTION.PLAY_EPISODE_OF_SERIES,
        LOG_ACTION.CREATE_REVIEW,
        LOG_ACTION.UPDATE_REVIEW,
        LOG_ACTION.DELETE_REVIEW,
      ];

      // Calculate summary metrics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Total users: distinct userId in audit logs
      const totalUsers = await this.auditLogRepository
        .createQueryBuilder('log')
        .select('COUNT(DISTINCT log.userId)', 'count')
        .getRawOne();

      // Active users: users who performed any engagement action within last 7 days
      // Includes: login, likes, watchlist actions, play actions, reviews
      const activeUsers = await this.auditLogRepository
        .createQueryBuilder('log')
        .select('COUNT(DISTINCT log.userId)', 'count')
        .where('log.action IN (:...engagementActions)', { engagementActions })
        .andWhere('log.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getRawOne();

      // New users: users who registered within last 30 days
      const newUsers = await this.auditLogRepository
        .createQueryBuilder('log')
        .select('COUNT(DISTINCT log.userId)', 'count')
        .where('log.action IN (:...registrationActions)', {
          registrationActions: [LOG_ACTION.CREATE_USER, LOG_ACTION.USER_REGISTRATION],
        })
        .andWhere('log.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
        .getRawOne();

      // Calculate churn rate (simplified: users who haven't logged in for 30 days)
      const churnedUsers = await this.auditLogRepository
        .createQueryBuilder('log')
        .select('COUNT(DISTINCT log.userId)', 'count')
        .where('log.action = :loginAction', { loginAction: LOG_ACTION.USER_LOGIN })
        .andWhere('log.createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
        .getRawOne();

      const totalUsersCount = parseInt(totalUsers.count) || 0;
      const activeUsersCount = parseInt(activeUsers.count) || 0;
      const newUsersCount = parseInt(newUsers.count) || 0;
      const churnedUsersCount = parseInt(churnedUsers.count) || 0;

      const churnRate = totalUsersCount > 0 ? (churnedUsersCount / totalUsersCount) * 100 : 0;

      // Calculate DAU for last 7 days
      const dauMetrics: DAUMetricDto[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const dayUsers = await this.auditLogRepository
          .createQueryBuilder('log')
          .select('COUNT(DISTINCT log.userId)', 'count')
          .where('log.action IN (:...engagementActions)', { engagementActions })
          .andWhere('log.createdAt >= :startOfDay', { startOfDay })
          .andWhere('log.createdAt < :endOfDay', { endOfDay })
          .getRawOne();

        const usersCount = parseInt(dayUsers.count) || 0;
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        // Calculate trend compared to previous day
        let trend: 'up' | 'down' = 'up';
        if (dauMetrics.length > 0) {
          const prevUsers = dauMetrics[dauMetrics.length - 1].users;
          trend = usersCount >= prevUsers ? 'up' : 'down';
        }

        dauMetrics.push({
          day: dayName,
          users: usersCount,
          trend,
        });
      }

      // Calculate MAU from beginning of year to current month
      const mauMetrics: MAUMetricDto[] = [];
      const currentMonth = now.getMonth(); // 0-based (0 = January)
      for (let i = 0; i <= currentMonth; i++) {
        const monthDate = new Date(now.getFullYear(), i, 1);
        const nextMonth = new Date(now.getFullYear(), i + 1, 1);

        const monthUsers = await this.auditLogRepository
          .createQueryBuilder('log')
          .select('COUNT(DISTINCT log.userId)', 'count')
          .where('log.action IN (:...engagementActions)', { engagementActions })
          .andWhere('log.createdAt >= :monthStart', { monthStart: monthDate })
          .andWhere('log.createdAt < :monthEnd', { monthEnd: nextMonth })
          .getRawOne();

        const usersCount = parseInt(monthUsers.count) || 0;
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });

        // Calculate trend and change compared to previous month
        let trend: 'up' | 'down' = 'up';
        let change = '+0.0%';
        if (mauMetrics.length > 0) {
          const prevUsers = mauMetrics[mauMetrics.length - 1].users;
          trend = usersCount >= prevUsers ? 'up' : 'down';
          if (prevUsers > 0) {
            const changePercent = ((usersCount - prevUsers) / prevUsers) * 100;
            change = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
          }
        }

        mauMetrics.push({
          month: monthName,
          users: usersCount,
          trend,
          change,
        });
      }

      // Calculate churn rate for last 4 months (simplified)
      const churnRateMetrics: ChurnRateMetricDto[] = [];
      for (let i = 3; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        // Users who logged in this month
        const activeThisMonth = await this.auditLogRepository
          .createQueryBuilder('log')
          .select('COUNT(DISTINCT log.userId)', 'count')
          .where('log.action IN (:...engagementActions)', { engagementActions })
          .andWhere('log.createdAt >= :monthStart', { monthStart: monthDate })
          .andWhere('log.createdAt < :monthEnd', { monthEnd: nextMonth })
          .getRawOne();

        // Users who logged in previous month but not this month
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
        const prevMonthEnd = monthDate;

        const activePrevMonth = await this.auditLogRepository
          .createQueryBuilder('log')
          .select('COUNT(DISTINCT log.userId)', 'count')
          .where('log.action IN (:...engagementActions)', { engagementActions })
          .andWhere('log.createdAt >= :prevMonthStart', { prevMonthStart })
          .andWhere('log.createdAt < :prevMonthEnd', { prevMonthEnd })
          .getRawOne();

        const activeThisMonthCount = parseInt(activeThisMonth.count) || 0;
        const activePrevMonthCount = parseInt(activePrevMonth.count) || 0;

        // Churn rate: percentage of previous month users who didn't return
        const churnRateValue =
          activePrevMonthCount > 0
            ? ((activePrevMonthCount - activeThisMonthCount) / activePrevMonthCount) * 100
            : 0;

        const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });

        // Calculate trend compared to previous month
        let trend: 'up' | 'down' = 'down'; // Lower churn rate is better
        if (churnRateMetrics.length > 0) {
          const prevRate = churnRateMetrics[churnRateMetrics.length - 1].rate;
          trend = churnRateValue <= prevRate ? 'down' : 'up';
        }

        churnRateMetrics.push({
          month: monthName,
          rate: parseFloat(churnRateValue.toFixed(1)),
          trend,
        });
      }

      const summary: UserSummaryDto = {
        totalUsers: totalUsersCount,
        activeUsers: activeUsersCount,
        newUsers: newUsersCount,
        churnRate: parseFloat(churnRate.toFixed(1)),
      };

      const userMetrics: UserMetricsDto = {
        dau: dauMetrics,
        mau: mauMetrics,
        churnRate: churnRateMetrics,
      };

      const result: UserStatsDto = {
        summary,
        userMetrics,
      };

      return result;
    } catch (error) {
      console.error('Analytics user stats error:', error);
      throw error;
    }
  }
}
