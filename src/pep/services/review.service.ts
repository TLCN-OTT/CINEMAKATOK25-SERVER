import { AuditLogService } from 'src/audit-log/service/audit-log.service';
import { EntityUser } from 'src/auth/entities/user.entity';
import { ContentType, EntityContent } from 'src/cms/entities/content.entity';
import { ContentService } from 'src/cms/services/content.service';

import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { REPORT_TYPE, REVIEW_STATUS } from '@app/common/enums/global.enum';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateReviewDto, ReviewDto, UpdateReviewDto } from '../dtos/review.dto';
import { EntityReport } from '../entities/report.entity';
import { EntityReviewReply } from '../entities/review-reply.entity';
import { EntityReview } from '../entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(EntityReview)
    private readonly reviewRepository: Repository<EntityReview>,
    @InjectRepository(EntityReport)
    private readonly reportRepository: Repository<EntityReport>,
    @InjectRepository(EntityReviewReply)
    private readonly reviewReplyRepository: Repository<EntityReviewReply>,
    private readonly contentService: ContentService,
    private readonly auditLogService: AuditLogService,
  ) {}
  // Define service methods for handling reviews here

  async createReview(userId: string, createReviewDto: CreateReviewDto) {
    const queryRunner = this.reviewRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const content = await this.contentService.findContentById(createReviewDto.contentId);

      // Tạo review mới
      const review = this.reviewRepository.create({
        ...createReviewDto,
        user: { id: userId } as EntityUser,
        content,
      });
      const savedReview = await queryRunner.manager.save(review);

      // Tính lại rating trung bình cho content
      const ratingStats = await queryRunner.manager
        .createQueryBuilder(EntityReview, 'review')
        .select('AVG(review.rating)', 'avgRating')
        .addSelect('COUNT(review.id)', 'totalReviews')
        .where('review.content_id = :contentId', { contentId: content.id })
        .getRawOne();

      // Cập nhật rating vào bảng content
      await queryRunner.manager.update(
        EntityContent,
        { id: content.id },
        {
          avgRating: parseFloat(ratingStats.avgRating) || 0,
          // reviewCount: parseInt(ratingStats.totalReviews) || 0, // Nếu có field này
        },
      );

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

  async updateReview(id: string, updateReviewDto: UpdateReviewDto, userId?: string) {
    const queryRunner = this.reviewRepository.manager.connection.createQueryRunner();
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

      // Tính lại rating trung bình
      const ratingStats = await queryRunner.manager
        .createQueryBuilder(EntityReview, 'review')
        .select('AVG(review.rating)', 'avgRating')
        .addSelect('COUNT(review.id)', 'totalReviews')
        .where('review.content_id = :contentId', { contentId: review.content.id })
        .getRawOne();

      // Cập nhật rating
      await queryRunner.manager.update(
        EntityContent,
        { id: review.content.id },
        {
          avgRating: parseFloat(ratingStats.avgRating) || 0,
        },
      );
      // Ghi log hành động cập nhật review
      await this.logReviewAction(userId || 'ADMIN', review.content, LOG_ACTION.UPDATE_REVIEW);

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
    const queryRunner = this.reviewRepository.manager.connection.createQueryRunner();
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

      const contentId = review.content.id;

      // Get all replies for this review
      const replies = await queryRunner.manager.find(EntityReviewReply, {
        where: { review: { id } },
        select: ['id'],
      });
      const replyIds = replies.map(reply => reply.id);

      // Delete all reports for replies
      if (replyIds.length > 0) {
        await queryRunner.manager.delete(EntityReport, {
          targetId:
            replyIds.length === 1
              ? replyIds[0]
              : queryRunner.manager.connection
                  .createQueryBuilder()
                  .where('target_id IN (:...ids)', { ids: replyIds })
                  .getQuery(),
          type: REPORT_TYPE.REVIEW_REPLY,
        });
      }

      // Delete all replies (cascade will handle nested replies)
      await queryRunner.manager.delete(EntityReviewReply, {
        review: { id },
      });

      // Delete all related reports for the review itself
      await queryRunner.manager.delete(EntityReport, {
        targetId: id,
        type: REPORT_TYPE.REVIEW,
      });

      await queryRunner.manager.delete(EntityReview, id);

      // Tính lại rating sau khi xóa
      const ratingStats = await queryRunner.manager
        .createQueryBuilder(EntityReview, 'review')
        .select('AVG(review.rating)', 'avgRating')
        .addSelect('COUNT(review.id)', 'totalReviews')
        .where('review.content_id = :contentId', { contentId })
        .getRawOne();

      // Cập nhật rating (nếu không còn review nào thì rating = 0)
      await queryRunner.manager.update(
        EntityContent,
        { id: contentId },
        {
          avgRating: parseFloat(ratingStats.avgRating) || 0,
        },
      );
      // Ghi log hành động xóa review
      await this.logReviewAction(userId || 'ADMIN', review.content, LOG_ACTION.DELETE_REVIEW);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findReviewById(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'content'],
    });
    if (!review) {
      throw new NotFoundException({
        message: `Review with ID ${id} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }
    return review;
  }

  async findReviews(query: PaginationQueryDto & { contentId?: string; userId?: string }) {
    const { page = 1, limit = 10, sort, search, contentId, userId, status } = query || {};

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.content', 'content')
      .leftJoinAndSelect('review.user', 'user');

    // Filter by status - default to ACTIVE if not specified
    const statusFilter = status || REVIEW_STATUS.ACTIVE;
    queryBuilder.andWhere('review.status = :status', { status: statusFilter });

    if (contentId) queryBuilder.andWhere('content.id = :contentId', { contentId });
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
    const review = await this.reviewRepository.findOne({
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
