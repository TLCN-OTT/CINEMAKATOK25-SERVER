import { EntityUser } from 'src/auth/entities/user.entity';
import { EntityContent } from 'src/cms/entities/content.entity';
import { ContentService } from 'src/cms/services/content.service';

import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateReviewDto, ReviewDto, UpdateReviewDto } from '../dtos/review.dto';
import { EntityReview } from '../entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(EntityReview)
    private readonly reviewRepository: Repository<EntityReview>,
    private readonly contentService: ContentService,
  ) {}
  // Define service methods for handling reviews here

  async createReview(userId: string, createReviewDto: CreateReviewDto) {
    const content = await this.contentService.findContentById(createReviewDto.contentId);
    const review = this.reviewRepository.create({
      ...createReviewDto,
      user: { id: userId } as EntityUser,
      content,
    });
    const savedReview = await this.reviewRepository.save(review);

    // Load review with relations to get full user and content data
    return this.findReviewById(savedReview.id);
  }

  async updateReview(id: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.findReviewById(id);
    Object.assign(review, updateReviewDto);
    const updatedReview = await this.reviewRepository.save(review);
    return this.findReviewById(updatedReview.id);
  }

  async deleteReview(id: string) {
    await this.findReviewById(id);
    await this.reviewRepository.delete(id);
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
    const { page = 1, limit = 10, sort, search, contentId, userId } = query || {};

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.content', 'content')
      .leftJoinAndSelect('review.user', 'user');

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
}
