import { AuditLogService } from 'src/audit-log/service/audit-log.service';
import { EntityUser } from 'src/auth/entities/user.entity';
import { ContentType, EntityContent } from 'src/cms/entities/content.entity';
import { EntityEpisode } from 'src/cms/entities/tvseries.entity';
import { ContentService } from 'src/cms/services/content.service';

import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateEpisodeReviewDto, UpdateEpisodeReviewDto } from '../dtos/episode.-review.dto';
import { CreateReviewDto, ReviewDto, UpdateReviewDto } from '../dtos/review.dto';
import { EntityReviewEpisode, REVIEW_STATUS } from '../entities/review-episode.entity';
import { EntityReview } from '../entities/review.entity';

@Injectable()
export class EpisodeReviewService {
  constructor(
    @InjectRepository(EntityReviewEpisode)
    private readonly reviewEpisodeRepository: Repository<EntityReviewEpisode>,
    private readonly contentService: ContentService,
    @InjectRepository(EntityEpisode)
    private readonly episodeRepository: Repository<EntityEpisode>,
    private readonly auditLogService: AuditLogService,
  ) {}
  // Define service methods for handling reviews here

  async createReview(userId: string, createEpisodeReviewDto: CreateEpisodeReviewDto) {
    const queryRunner = this.reviewEpisodeRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const episode = await this.episodeRepository
        .createQueryBuilder('episode')
        .leftJoinAndSelect('episode.season', 'season')
        .leftJoinAndSelect('season.tvseries', 'tv')
        .leftJoinAndSelect('tv.metaData', 'metaData')
        .where('episode.id = :id', { id: createEpisodeReviewDto.episodeId })
        .getOne();
      if (!episode) {
        throw new NotFoundException({
          message: `Episode with ID ${createEpisodeReviewDto.episodeId} not found`,
          code: ERROR_CODE.ENTITY_NOT_FOUND,
        });
      }
      const existingReview = await this.reviewEpisodeRepository.findOne({
        where: {
          user: { id: userId },
          episode: { id: createEpisodeReviewDto.episodeId },
        },
      });

      if (existingReview) {
        throw new BadRequestException({
          message: 'You have already reviewed this episode',
          code: ERROR_CODE.ALREADY_EXISTS,
        });
      }
      const content = await this.contentService.findContentById(
        episode.season.tvseries.metaData.id,
      );

      // Tạo review mới
      const review = this.reviewEpisodeRepository.create({
        ...createEpisodeReviewDto,
        user: { id: userId } as EntityUser,
        episode: episode,
      });
      const savedReview = await queryRunner.manager.save(review);

      // Ghi log hành động tạo review
      await this.logReviewAction(userId, content, LOG_ACTION.CREATE_REVIEW);

      await queryRunner.commitTransaction();

      // Load review với relations đầy đủ
      return this.findReviewById(savedReview.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateReview(id: string, updateReviewDto: UpdateEpisodeReviewDto, userId?: string) {
    const queryRunner = this.reviewEpisodeRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const review = await this.findReviewById(id);

      // Check ownership if userId is provided
      if (userId && review.user.id !== userId) {
        throw new ForbiddenException({
          message: 'You are not authorized to update this review',
          code: ERROR_CODE.UNAUTHORIZED,
        });
      }

      Object.assign(review, updateReviewDto);
      const updatedReview = await queryRunner.manager.save(review);
      const content = await this.contentService.findContentById(
        review.episode.season.tvseries.metaData.id,
      );

      // Ghi log hành động cập nhật review
      await this.logReviewAction(userId || 'ADMIN', content, LOG_ACTION.UPDATE_REVIEW);

      await queryRunner.commitTransaction();
      return this.findReviewById(updatedReview.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteReview(id: string, userId?: string) {
    const queryRunner = this.reviewEpisodeRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const review = await this.findReviewById(id);

      // Check ownership if userId is provided
      if (userId && review.user.id !== userId) {
        throw new ForbiddenException({
          message: 'You are not authorized to delete this review',
          code: ERROR_CODE.UNAUTHORIZED,
        });
      }
      const content = await this.contentService.findContentById(
        review.episode.season.tvseries.metaData.id,
      );

      await queryRunner.manager.delete(EntityReviewEpisode, id);
      // Ghi log hành động xóa review
      await this.logReviewAction(userId || 'ADMIN', content, LOG_ACTION.DELETE_REVIEW);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findReviewById(id: string) {
    const review = await this.reviewEpisodeRepository.findOne({
      where: { id },
      relations: [
        'user',
        'episode',
        'episode.season',
        'episode.season.tvseries',
        'episode.season.tvseries.metaData',
      ],
    });
    if (!review) {
      throw new NotFoundException({
        message: `Review with ID ${id} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }
    return review;
  }

  async findReviews(query: PaginationQueryDto & { episodeId?: string; userId?: string }) {
    const { page = 1, limit = 10, sort, search, episodeId, userId } = query || {};

    const queryBuilder = this.reviewEpisodeRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.episode', 'episode')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.status = :status', { status: REVIEW_STATUS.APPROVED });

    if (episodeId) queryBuilder.andWhere('episode.id = :episodeId', { episodeId });
    if (userId) queryBuilder.andWhere('user.id = :userId', { userId });
    if (search)
      queryBuilder.andWhere('review.contentReviewed ILIKE :search', { search: `%${search}%` });

    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      Object.entries(sortObj).forEach(([key, order]) => {
        queryBuilder.addOrderBy(`review.${key}`, order as 'ASC' | 'DESC');
      });
    } else if (!search) {
      queryBuilder.orderBy('review.createdAt', 'DESC');
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Check if user is the owner of a review
   */
  async isReviewOwner(reviewId: string, userId: string): Promise<boolean> {
    const review = await this.reviewEpisodeRepository.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException({
        message: `Review with ID ${reviewId} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    return review.user.id === userId;
  }

  async logReviewAction(
    userId: string,
    content: any,
    action: LOG_ACTION.CREATE_REVIEW | LOG_ACTION.UPDATE_REVIEW | LOG_ACTION.DELETE_REVIEW,
  ) {
    const isMovie = content.type === ContentType.MOVIE;
    const contentId = await this.contentService.getIdOfTVOrMovie(content.id);
    const typeText = isMovie ? 'movie' : 'TV series';
    await this.auditLogService.log({
      action,
      userId: userId,
      description: `User ${userId} ${action === LOG_ACTION.CREATE_REVIEW ? 'created' : action === LOG_ACTION.UPDATE_REVIEW ? 'updated' : 'deleted'} review on ${typeText} with ID ${contentId}`,
    });
  }
}
