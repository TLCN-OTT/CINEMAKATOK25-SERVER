import { QueryRunner, Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { REPORT_TYPE, REVIEW_STATUS } from '@app/common/enums/global.enum';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditLogService } from '../../../audit-log/service/audit-log.service';
import { ContentType, EntityContent } from '../../../cms/entities/content.entity';
import { ContentService } from '../../../cms/services/content.service';
import { EntityReport } from '../../entities/report.entity';
import { EntityReview } from '../../entities/review.entity';
import { ReviewService } from '../review.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepository: Repository<EntityReview>;
  let reportRepository: Repository<EntityReport>;
  let contentService: ContentService;
  let auditLogService: AuditLogService;
  let queryRunner: QueryRunner;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    },
  };

  const mockMovieContent = {
    id: 'content-1',
    title: 'Test Movie',
    type: ContentType.MOVIE,
    avgRating: 0,
  };

  const mockTVContent = {
    id: 'content-2',
    title: 'Test TV Series',
    type: ContentType.TVSERIES,
    avgRating: 0,
  };

  const mockReview = {
    id: 'review-1',
    contentReviewed: 'Great content!',
    rating: 5,
    status: REVIEW_STATUS.ACTIVE,
    user: { id: 'user-1' },
    content: mockMovieContent,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: getRepositoryToken(EntityReview),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
            manager: {
              connection: {
                createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
              },
            },
          },
        },
        {
          provide: getRepositoryToken(EntityReport),
          useValue: {
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ContentService,
          useValue: {
            findContentById: jest.fn(),
            getIdOfTVOrMovie: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    reviewRepository = module.get<Repository<EntityReview>>(getRepositoryToken(EntityReview));
    reportRepository = module.get<Repository<EntityReport>>(getRepositoryToken(EntityReport));
    contentService = module.get<ContentService>(ContentService);
    auditLogService = module.get<AuditLogService>(AuditLogService);

    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const createDto = {
      contentId: 'content-1',
      contentReviewed: 'Great content!',
      rating: 5,
    };

    it('should create a review successfully and update content avgRating', async () => {
      const mockRatingStats = {
        avgRating: '4.5',
        totalReviews: '2',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRatingStats),
      };

      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockMovieContent as any);
      jest.spyOn(reviewRepository, 'create').mockReturnValue(mockReview as any);
      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');
      mockQueryRunner.manager.save.mockResolvedValue(mockReview);
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.createReview('user-1', createDto as any);

      expect(result).toEqual(mockReview);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        EntityContent,
        { id: 'content-1' },
        { avgRating: 4.5 },
      );
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.CREATE_REVIEW,
        userId: 'user-1',
        description: expect.stringContaining('created review'),
      });
    });

    it('should handle avgRating calculation with no existing reviews', async () => {
      const mockRatingStats = {
        avgRating: null,
        totalReviews: '1',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRatingStats),
      };

      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockMovieContent as any);
      jest.spyOn(reviewRepository, 'create').mockReturnValue(mockReview as any);
      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');
      mockQueryRunner.manager.save.mockResolvedValue(mockReview);
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.createReview('user-1', createDto as any);

      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        EntityContent,
        { id: 'content-1' },
        { avgRating: 0 },
      );
    });

    it('should rollback transaction on error', async () => {
      jest.spyOn(contentService, 'findContentById').mockRejectedValue(new Error('DB Error'));

      await expect(service.createReview('user-1', createDto as any)).rejects.toThrow('DB Error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('updateReview', () => {
    const updateDto = {
      contentReviewed: 'Updated review',
      rating: 4,
    };

    it('should update a review successfully and recalculate avgRating', async () => {
      const mockRatingStats = {
        avgRating: '4.2',
        totalReviews: '3',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRatingStats),
      };

      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');
      mockQueryRunner.manager.save.mockResolvedValue({ ...mockReview, ...updateDto });
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.updateReview('review-1', updateDto as any, 'user-1');

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        EntityContent,
        { id: 'content-1' },
        { avgRating: 4.2 },
      );
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UPDATE_REVIEW,
        userId: 'user-1',
        description: expect.stringContaining('updated review'),
      });
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);

      await expect(
        service.updateReview('review-1', updateDto as any, 'different-user'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should allow update without userId (admin)', async () => {
      const mockRatingStats = {
        avgRating: '4.2',
        totalReviews: '3',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRatingStats),
      };

      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');
      mockQueryRunner.manager.save.mockResolvedValue({ ...mockReview, ...updateDto });
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.updateReview('review-1', updateDto as any);

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UPDATE_REVIEW,
        userId: 'ADMIN',
        description: expect.stringContaining('updated review'),
      });
    });
  });

  describe('deleteReview', () => {
    it('should delete a review successfully and recalculate avgRating', async () => {
      const mockRatingStats = {
        avgRating: '4.0',
        totalReviews: '2',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRatingStats),
      };

      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');
      mockQueryRunner.manager.delete.mockResolvedValue({ affected: 1 });
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.deleteReview('review-1', 'user-1');

      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(EntityReport, {
        targetId: 'review-1',
        type: REPORT_TYPE.REVIEW,
      });
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(EntityReview, 'review-1');
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        EntityContent,
        { id: 'content-1' },
        { avgRating: 4.0 },
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.DELETE_REVIEW,
        userId: 'user-1',
        description: expect.stringContaining('deleted review'),
      });
    });

    it('should set avgRating to 0 when no reviews remain', async () => {
      const mockRatingStats = {
        avgRating: null,
        totalReviews: '0',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRatingStats),
      };

      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');
      mockQueryRunner.manager.delete.mockResolvedValue({ affected: 1 });
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.deleteReview('review-1', 'user-1');

      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        EntityContent,
        { id: 'content-1' },
        { avgRating: 0 },
      );
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);

      await expect(service.deleteReview('review-1', 'different-user')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('findReviewById', () => {
    it('should return a review by id', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview as any);

      const result = await service.findReviewById('review-1');

      expect(result).toEqual(mockReview);
      expect(reviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        relations: ['user', 'content'],
      });
    });

    it('should throw NotFoundException if review not found', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findReviewById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findReviews', () => {
    it('should return paginated reviews with default status ACTIVE', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
      };

      jest.spyOn(reviewRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findReviews({ page: 1, limit: 10 });

      expect(result).toEqual({ data: [mockReview], total: 1 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('review.status = :status', {
        status: REVIEW_STATUS.ACTIVE,
      });
    });

    it('should filter by contentId', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
      };

      jest.spyOn(reviewRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findReviews({ page: 1, limit: 10, contentId: 'content-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('content.id = :contentId', {
        contentId: 'content-1',
      });
    });

    it('should filter by userId', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
      };

      jest.spyOn(reviewRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findReviews({ page: 1, limit: 10, userId: 'user-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.id = :userId', {
        userId: 'user-1',
      });
    });

    it('should search by content', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
      };

      jest.spyOn(reviewRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findReviews({ page: 1, limit: 10, search: 'great' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'review.contentReviewed ILIKE :search',
        { search: '%great%' },
      );
    });

    it('should apply custom sort', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
      };

      jest.spyOn(reviewRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findReviews({
        page: 1,
        limit: 10,
        sort: JSON.stringify({ rating: 'DESC' }),
      });

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('review.rating', 'DESC');
    });
  });

  describe('isReviewOwner', () => {
    it('should return true if user is the owner', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview as any);

      const result = await service.isReviewOwner('review-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false if user is not the owner', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview as any);

      const result = await service.isReviewOwner('review-1', 'different-user');

      expect(result).toBe(false);
    });

    it('should throw NotFoundException if review not found', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);

      await expect(service.isReviewOwner('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('logReviewAction', () => {
    it('should log create review action for movie', async () => {
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      await service.logReviewAction('user-1', mockMovieContent, LOG_ACTION.CREATE_REVIEW);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.CREATE_REVIEW,
        userId: 'user-1',
        description: 'User user-1 created review on movie with ID movie-1',
      });
    });

    it('should log update review action for TV series', async () => {
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('tv-1');

      await service.logReviewAction('user-1', mockTVContent, LOG_ACTION.UPDATE_REVIEW);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UPDATE_REVIEW,
        userId: 'user-1',
        description: 'User user-1 updated review on TV series with ID tv-1',
      });
    });

    it('should log delete review action', async () => {
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      await service.logReviewAction('user-1', mockMovieContent, LOG_ACTION.DELETE_REVIEW);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.DELETE_REVIEW,
        userId: 'user-1',
        description: 'User user-1 deleted review on movie with ID movie-1',
      });
    });
  });
});
