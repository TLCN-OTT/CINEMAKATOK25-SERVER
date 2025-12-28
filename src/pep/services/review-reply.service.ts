import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { REPORT_TYPE, REVIEW_STATUS } from '@app/common/enums/global.enum';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityUser } from '../../auth/entities/user.entity';
import { CreateReviewReplyDto, UpdateReviewReplyDto } from '../dtos/review-reply.dto';
import { EntityReport } from '../entities/report.entity';
import { EntityReviewEpisode } from '../entities/review-episode.entity';
import { EntityReviewReply } from '../entities/review-reply.entity';
import { EntityReview } from '../entities/review.entity';

@Injectable()
export class ReviewReplyService {
  constructor(
    @InjectRepository(EntityReviewReply)
    private readonly reviewReplyRepository: Repository<EntityReviewReply>,
    @InjectRepository(EntityReview)
    private readonly reviewRepository: Repository<EntityReview>,
    @InjectRepository(EntityReviewEpisode)
    private readonly reviewEpisodeRepository: Repository<EntityReviewEpisode>,
    @InjectRepository(EntityReport)
    private readonly reportRepository: Repository<EntityReport>,
  ) {}

  async createReply(userId: string, createReplyDto: CreateReviewReplyDto) {
    // Validate that exactly one of reviewId or episodeReviewId is provided
    const hasReviewId = !!createReplyDto.reviewId;
    const hasEpisodeReviewId = !!createReplyDto.episodeReviewId;

    if (!hasReviewId && !hasEpisodeReviewId) {
      throw new ForbiddenException({
        message: 'Either reviewId or episodeReviewId must be provided',
        code: ERROR_CODE.UNAUTHORIZED,
      });
    }

    if (hasReviewId && hasEpisodeReviewId) {
      throw new ForbiddenException({
        message: 'Cannot provide both reviewId and episodeReviewId',
        code: ERROR_CODE.UNAUTHORIZED,
      });
    }

    // Kiểm tra review hoặc episode review có tồn tại không
    if (hasReviewId) {
      const review = await this.reviewRepository.findOne({
        where: { id: createReplyDto.reviewId },
      });

      if (!review) {
        throw new NotFoundException({
          message: `Review not found`,
          code: ERROR_CODE.ENTITY_NOT_FOUND,
        });
      }
    } else {
      const episodeReview = await this.reviewEpisodeRepository.findOne({
        where: { id: createReplyDto.episodeReviewId },
      });

      if (!episodeReview) {
        throw new NotFoundException({
          message: `Episode review not found`,
          code: ERROR_CODE.ENTITY_NOT_FOUND,
        });
      }
    }

    // Nếu có parentReplyId, kiểm tra parent reply có tồn tại không
    if (createReplyDto.parentReplyId) {
      const parentReply = await this.reviewReplyRepository.findOne({
        where: { id: createReplyDto.parentReplyId },
        relations: ['review', 'episodeReview'],
      });

      if (!parentReply) {
        throw new NotFoundException({
          message: `Parent reply not found`,
          code: ERROR_CODE.ENTITY_NOT_FOUND,
        });
      }

      // Đảm bảo parent reply thuộc cùng review hoặc episode review
      if (
        hasReviewId &&
        (!parentReply.review || parentReply.review.id !== createReplyDto.reviewId)
      ) {
        throw new ForbiddenException({
          message: 'Parent reply does not belong to the specified review',
          code: ERROR_CODE.UNAUTHORIZED,
        });
      }

      if (
        hasEpisodeReviewId &&
        (!parentReply.episodeReview ||
          parentReply.episodeReview.id !== createReplyDto.episodeReviewId)
      ) {
        throw new ForbiddenException({
          message: 'Parent reply does not belong to the specified episode review',
          code: ERROR_CODE.UNAUTHORIZED,
        });
      }
    }

    const reply = this.reviewReplyRepository.create({
      content: createReplyDto.content,
      user: { id: userId } as EntityUser,
      review: hasReviewId ? ({ id: createReplyDto.reviewId } as EntityReview) : null,
      episodeReview: hasEpisodeReviewId
        ? ({ id: createReplyDto.episodeReviewId } as EntityReviewEpisode)
        : null,
      parentReply: createReplyDto.parentReplyId
        ? ({ id: createReplyDto.parentReplyId } as EntityReviewReply)
        : null,
    });

    const savedReply = await this.reviewReplyRepository.save(reply);
    return this.findReplyById(savedReply.id);
  }

  async updateReply(id: string, updateReplyDto: UpdateReviewReplyDto, userId?: string) {
    const reply = await this.findReplyById(id);

    // Check ownership if userId is provided
    if (userId && reply.user.id !== userId) {
      throw new ForbiddenException({
        message: 'You are not authorized to update this reply',
        code: ERROR_CODE.UNAUTHORIZED,
      });
    }

    Object.assign(reply, updateReplyDto);
    const updatedReply = await this.reviewReplyRepository.save(reply);
    return this.findReplyById(updatedReply.id);
  }

  async deleteReply(id: string, userId?: string) {
    const queryRunner = this.reviewReplyRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reply = await this.findReplyById(id);

      // Check ownership if userId is provided
      if (userId && reply.user.id !== userId) {
        throw new ForbiddenException({
          message: 'You are not authorized to delete this reply',
          code: ERROR_CODE.UNAUTHORIZED,
        });
      }

      // Collect all reply IDs (current + all descendants)
      const allReplyIds = await this.collectAllDescendantReplyIds(id, queryRunner);
      allReplyIds.push(id); // Add current reply

      // Delete all reports for all these replies in one query
      if (allReplyIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(EntityReport)
          .where('target_id IN (:...ids)', { ids: allReplyIds })
          .andWhere('type = :type', { type: REPORT_TYPE.REVIEW_REPLY })
          .execute();
      }

      // Delete all child replies recursively (bottom-up)
      await this.deleteChildRepliesRecursively(id, queryRunner);

      // Delete reports for main reply (already deleted above, but kept for clarity)
      // Delete main reply
      await queryRunner.manager.delete(EntityReviewReply, id);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Collect all descendant reply IDs recursively
   */
  private async collectAllDescendantReplyIds(
    parentReplyId: string,
    queryRunner: any,
  ): Promise<string[]> {
    const childReplies = await queryRunner.manager.find(EntityReviewReply, {
      where: { parentReply: { id: parentReplyId } },
      select: ['id'],
    });

    let allIds: string[] = childReplies.map(child => child.id);

    // Recursively collect descendants
    for (const child of childReplies) {
      const descendantIds = await this.collectAllDescendantReplyIds(child.id, queryRunner);
      allIds = allIds.concat(descendantIds);
    }

    return allIds;
  }

  /**
   * Xóa đệ quy tất cả child replies (bottom-up approach)
   */
  private async deleteChildRepliesRecursively(
    parentReplyId: string,
    queryRunner: any,
  ): Promise<void> {
    // Lấy tất cả child replies
    const childReplies = await queryRunner.manager.find(EntityReviewReply, {
      where: { parentReply: { id: parentReplyId } },
      select: ['id'],
    });

    // Đệ quy xóa child replies của mỗi child (go deeper first)
    for (const child of childReplies) {
      await this.deleteChildRepliesRecursively(child.id, queryRunner);
      // Xóa child reply (reports already deleted in batch)
      await queryRunner.manager.delete(EntityReviewReply, child.id);
    }
  }

  async findReplyById(id: string) {
    const reply = await this.reviewReplyRepository.findOne({
      where: { id },
      relations: [
        'user',
        'review',
        'episodeReview',
        'parentReply',
        'childReplies',
        'childReplies.user',
      ],
    });

    if (!reply) {
      throw new NotFoundException({
        message: `Reply not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    return reply;
  }

  async findReplies(
    query: PaginationQueryDto & {
      reviewId?: string;
      episodeReviewId?: string;
      userId?: string;
      parentReplyId?: string;
    },
  ) {
    const {
      page = 1,
      limit = 10,
      sort,
      search,
      reviewId,
      episodeReviewId,
      userId,
      status,
      parentReplyId,
    } = query || {};

    const queryBuilder = this.reviewReplyRepository
      .createQueryBuilder('reply')
      .leftJoinAndSelect('reply.review', 'review')
      .leftJoinAndSelect('reply.episodeReview', 'episodeReview')
      .leftJoinAndSelect('reply.user', 'user')
      .leftJoinAndSelect('reply.parentReply', 'parentReply');

    // Filter by status - default to ACTIVE if not specified
    const statusFilter = status || REVIEW_STATUS.ACTIVE;
    queryBuilder.andWhere('reply.status = :status', { status: statusFilter });

    if (reviewId) queryBuilder.andWhere('review.id = :reviewId', { reviewId });
    if (episodeReviewId)
      queryBuilder.andWhere('episodeReview.id = :episodeReviewId', { episodeReviewId });
    if (userId) queryBuilder.andWhere('user.id = :userId', { userId });

    // Filter by parentReplyId - if null, get top-level replies only
    if (parentReplyId === null || parentReplyId === 'null') {
      queryBuilder.andWhere('reply.parent_reply_id IS NULL');
    } else if (parentReplyId) {
      queryBuilder.andWhere('parentReply.id = :parentReplyId', { parentReplyId });
    }

    if (search) queryBuilder.andWhere('reply.content ILIKE :search', { search: `%${search}%` });

    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      Object.entries(sortObj).forEach(([key, order]) => {
        queryBuilder.addOrderBy(`reply.${key}`, order as 'ASC' | 'DESC');
      });
    } else {
      queryBuilder.orderBy('reply.createdAt', 'ASC');
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Get reply counts for all replies
    if (data.length > 0) {
      const replyIds = data.map(reply => reply.id);
      const replyCounts = await this.getReplyCountsForReplies(replyIds);

      // Attach reply count to each reply
      data.forEach(reply => {
        (reply as any).replyCount = replyCounts[reply.id] || 0;
      });
    }

    return { data, total };
  }

  async isReplyOwner(replyId: string, userId: string): Promise<boolean> {
    const reply = await this.reviewReplyRepository.findOne({
      where: { id: replyId },
      relations: ['user'],
    });

    if (!reply) {
      throw new NotFoundException({
        message: `Reply not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    return reply.user.id === userId;
  }

  /**
   * Count total replies for a review (including all nested replies)
   */
  async countRepliesForReview(reviewId: string): Promise<number> {
    const count = await this.reviewReplyRepository.count({
      where: {
        review: { id: reviewId },
        status: REVIEW_STATUS.ACTIVE,
      },
    });
    return count;
  }

  /**
   * Count total replies for an episode review (including all nested replies)
   */
  async countRepliesForEpisodeReview(episodeReviewId: string): Promise<number> {
    const count = await this.reviewReplyRepository.count({
      where: {
        episodeReview: { id: episodeReviewId },
        status: REVIEW_STATUS.ACTIVE,
      },
    });
    return count;
  }

  /**
   * Count direct child replies for a specific reply
   */
  async countRepliesForReply(replyId: string): Promise<number> {
    const count = await this.reviewReplyRepository.count({
      where: {
        parentReply: { id: replyId },
        status: REVIEW_STATUS.ACTIVE,
      },
    });
    return count;
  }

  /**
   * Get reply count statistics for multiple reviews
   */
  async getReplyCountsForReviews(reviewIds: string[]): Promise<Record<string, number>> {
    const counts = await this.reviewReplyRepository
      .createQueryBuilder('reply')
      .select('reply.review_id', 'reviewId')
      .addSelect('COUNT(reply.id)', 'count')
      .where('reply.review_id IN (:...reviewIds)', { reviewIds })
      .andWhere('reply.status = :status', { status: REVIEW_STATUS.ACTIVE })
      .groupBy('reply.review_id')
      .getRawMany();

    const countMap: Record<string, number> = {};
    counts.forEach(item => {
      countMap[item.reviewId] = parseInt(item.count, 10);
    });

    // Fill in 0 for reviews with no replies
    reviewIds.forEach(id => {
      if (!(id in countMap)) {
        countMap[id] = 0;
      }
    });

    return countMap;
  }

  /**
   * Get reply count statistics for multiple episode reviews
   */
  async getReplyCountsForEpisodeReviews(
    episodeReviewIds: string[],
  ): Promise<Record<string, number>> {
    const counts = await this.reviewReplyRepository
      .createQueryBuilder('reply')
      .select('reply.episode_review_id', 'episodeReviewId')
      .addSelect('COUNT(reply.id)', 'count')
      .where('reply.episode_review_id IN (:...episodeReviewIds)', { episodeReviewIds })
      .andWhere('reply.status = :status', { status: REVIEW_STATUS.ACTIVE })
      .groupBy('reply.episode_review_id')
      .getRawMany();

    const countMap: Record<string, number> = {};
    counts.forEach(item => {
      countMap[item.episodeReviewId] = parseInt(item.count, 10);
    });

    // Fill in 0 for episode reviews with no replies
    episodeReviewIds.forEach(id => {
      if (!(id in countMap)) {
        countMap[id] = 0;
      }
    });

    return countMap;
  }

  /**
   * Get reply count statistics for multiple replies
   */
  async getReplyCountsForReplies(replyIds: string[]): Promise<Record<string, number>> {
    const counts = await this.reviewReplyRepository
      .createQueryBuilder('reply')
      .select('reply.parent_reply_id', 'parentReplyId')
      .addSelect('COUNT(reply.id)', 'count')
      .where('reply.parent_reply_id IN (:...replyIds)', { replyIds })
      .andWhere('reply.status = :status', { status: REVIEW_STATUS.ACTIVE })
      .groupBy('reply.parent_reply_id')
      .getRawMany();

    const countMap: Record<string, number> = {};
    counts.forEach(item => {
      countMap[item.parentReplyId] = parseInt(item.count, 10);
    });

    // Fill in 0 for replies with no child replies
    replyIds.forEach(id => {
      if (!(id in countMap)) {
        countMap[id] = 0;
      }
    });

    return countMap;
  }
}
