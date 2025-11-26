import { QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { REPORT_TYPE, REVIEW_STATUS } from '@app/common/enums/global.enum';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditLogService } from '../../../audit-log/service/audit-log.service';
import { ContentType } from '../../../cms/entities/content.entity';
import { EntityEpisode } from '../../../cms/entities/tvseries.entity';
import { ContentService } from '../../../cms/services/content.service';
import { EntityReport } from '../../entities/report.entity';
import { EntityReviewEpisode } from '../../entities/review-episode.entity';
import { EpisodeReviewService } from '../episode-review.service';

describe('EpisodeReviewService', () => {
  let service: EpisodeReviewService;
  let reviewEpisodeRepository: Repository<EntityReviewEpisode>;
  let reportRepository: Repository<EntityReport>;
  let episodeRepository: Repository<EntityEpisode>;
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
    },
  };

  const mockEpisode = {
    id: 'episode-1',
    season: {
      id: 'season-1',
      tvseries: {
        id: 'tv-1',
        metaData: {
          id: 'content-1',
        },
      },
    },
  };

  const mockReview = {
    id: 'review-1',
    contentReviewed: 'Great episode!',
    rating: 5,
    status: REVIEW_STATUS.ACTIVE,
    user: { id: 'user-1' },
    episode: mockEpisode,
    createdAt: new Date(),
  };

  const mockContent = {
    id: 'content-1',
    type: ContentType.TVSERIES,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpisodeReviewService,
        {
          provide: getRepositoryToken(EntityReviewEpisode),
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
          provide: getRepositoryToken(EntityEpisode),
          useValue: {
            createQueryBuilder: jest.fn(),
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

    service = module.get<EpisodeReviewService>(EpisodeReviewService);
    reviewEpisodeRepository = module.get<Repository<EntityReviewEpisode>>(
      getRepositoryToken(EntityReviewEpisode),
    );
    reportRepository = module.get<Repository<EntityReport>>(getRepositoryToken(EntityReport));
    episodeRepository = module.get<Repository<EntityEpisode>>(getRepositoryToken(EntityEpisode));
    contentService = module.get<ContentService>(ContentService);
    auditLogService = module.get<AuditLogService>(AuditLogService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const createDto = {
      episodeId: 'episode-1',
      contentReviewed: 'Great episode!',
      rating: 5,
    };

    it('should create a review successfully', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockEpisode),
      };

      jest.spyOn(episodeRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(reviewEpisodeRepository, 'create').mockReturnValue(mockReview as any);
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockContent as any);
      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      mockQueryRunner.manager.save.mockResolvedValue(mockReview);

      const result = await service.createReview('user-1', createDto as any);

      expect(result).toEqual(mockReview);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.CREATE_REVIEW,
        userId: 'user-1',
        description: expect.stringContaining('created review'),
      });
    });

    it('should throw NotFoundException if episode not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(episodeRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await expect(service.createReview('user-1', createDto as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if review already exists', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockEpisode),
      };

      jest.spyOn(episodeRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockReview as any);

      await expect(service.createReview('user-1', createDto as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('updateReview', () => {
    const updateDto = {
      contentReviewed: 'Updated review',
      rating: 4,
    };

    it('should update a review successfully', async () => {
      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockContent as any);
      mockQueryRunner.manager.save.mockResolvedValue({ ...mockReview, ...updateDto });

      const result = await service.updateReview('review-1', updateDto as any, 'user-1');

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
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
      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockContent as any);
      mockQueryRunner.manager.save.mockResolvedValue({ ...mockReview, ...updateDto });

      const result = await service.updateReview('review-1', updateDto as any);

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      jest.spyOn(service, 'findReviewById').mockResolvedValue(mockReview as any);
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockContent as any);
      mockQueryRunner.manager.delete.mockResolvedValue({ affected: 1 });

      await service.deleteReview('review-1', 'user-1');

      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(EntityReport, {
        targetId: 'review-1',
        type: REPORT_TYPE.EPISODE_REVIEW,
      });
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(EntityReviewEpisode, 'review-1');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.DELETE_REVIEW,
        userId: 'user-1',
        description: expect.stringContaining('deleted review'),
      });
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
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockReview as any);

      const result = await service.findReviewById('review-1');

      expect(result).toEqual(mockReview);
      expect(reviewEpisodeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        relations: [
          'user',
          'episode',
          'episode.season',
          'episode.season.tvseries',
          'episode.season.tvseries.metaData',
        ],
      });
    });

    it('should throw NotFoundException if review not found', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(null);

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

      jest
        .spyOn(reviewEpisodeRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findReviews({ page: 1, limit: 10 });

      expect(result).toEqual({ data: [mockReview], total: 1 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('review.status = :status', {
        status: REVIEW_STATUS.ACTIVE,
      });
    });

    it('should filter by episodeId', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
      };

      jest
        .spyOn(reviewEpisodeRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.findReviews({ page: 1, limit: 10, episodeId: 'episode-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('episode.id = :episodeId', {
        episodeId: 'episode-1',
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

      jest
        .spyOn(reviewEpisodeRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

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

      jest
        .spyOn(reviewEpisodeRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.findReviews({ page: 1, limit: 10, search: 'great' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'review.contentReviewed ILIKE :search',
        { search: '%great%' },
      );
    });
  });

  describe('isReviewOwner', () => {
    it('should return true if user is the owner', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockReview as any);

      const result = await service.isReviewOwner('review-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false if user is not the owner', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockReview as any);

      const result = await service.isReviewOwner('review-1', 'different-user');

      expect(result).toBe(false);
    });

    it('should throw NotFoundException if review not found', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.isReviewOwner('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('logReviewAction', () => {
    it('should log create review action for TV series', async () => {
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('tv-content-1');

      await service.logReviewAction('user-1', mockContent, LOG_ACTION.CREATE_REVIEW);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.CREATE_REVIEW,
        userId: 'user-1',
        description: 'User user-1 created review on TV series with ID tv-content-1',
      });
    });

    it('should log update review action for movie', async () => {
      const movieContent = { ...mockContent, type: ContentType.MOVIE };
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      await service.logReviewAction('user-1', movieContent, LOG_ACTION.UPDATE_REVIEW);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UPDATE_REVIEW,
        userId: 'user-1',
        description: 'User user-1 updated review on movie with ID movie-1',
      });
    });

    it('should log delete review action', async () => {
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('content-1');

      await service.logReviewAction('user-1', mockContent, LOG_ACTION.DELETE_REVIEW);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.DELETE_REVIEW,
        userId: 'user-1',
        description: 'User user-1 deleted review on TV series with ID content-1',
      });
    });
  });
});
