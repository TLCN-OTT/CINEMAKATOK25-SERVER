import { Repository } from 'typeorm';

import { LOG_ACTION } from '@app/common/enums/log.enum';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditLog } from '../../../audit-log/entities/audit-log.entity';
import { EntityWatchProgress } from '../../../pep/entities/watch-progress.entity';
import { EntityCategory } from '../../entities/category.entity';
import { EntityMovie } from '../../entities/movie.entity';
import { EntityTVSeries } from '../../entities/tvseries.entity';
import { AnalyticsService } from '../analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let movieRepository: Repository<EntityMovie>;
  let tvseriesRepository: Repository<EntityTVSeries>;
  let categoryRepository: Repository<EntityCategory>;
  let watchProgressRepository: Repository<EntityWatchProgress>;
  let auditLogRepository: Repository<AuditLog>;

  const mockMetaData = {
    id: 'meta-1',
    title: 'Test Movie',
    viewCount: 100,
    avgRating: 4.5,
    thumbnail: 'thumb.jpg',
  } as any;

  const mockMovie = {
    id: 'movie-1',
    metaData: mockMetaData,
  } as any;

  const mockTVSeries = {
    id: 'tv-1',
    metaData: mockMetaData,
  } as any;

  const mockCategory = {
    id: 'cat-1',
    categoryName: 'Action',
    contents: [mockMetaData],
  } as any;

  const mockAuditLog = {
    id: 'log-1',
    action: LOG_ACTION.CONTENT_VIEW_INCREASED,
    description: 'Content view increased for meta-1',
    createdAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(EntityMovie),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityTVSeries),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityCategory),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityWatchProgress),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    movieRepository = module.get<Repository<EntityMovie>>(getRepositoryToken(EntityMovie));
    tvseriesRepository = module.get<Repository<EntityTVSeries>>(getRepositoryToken(EntityTVSeries));
    categoryRepository = module.get<Repository<EntityCategory>>(getRepositoryToken(EntityCategory));
    watchProgressRepository = module.get<Repository<EntityWatchProgress>>(
      getRepositoryToken(EntityWatchProgress),
    );
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));

    jest.clearAllMocks();
  });

  describe('getMoviesStats', () => {
    it('should return movies stats', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockMovie], 1]),
      };
      const mockAuditQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      };

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getMoviesStats({ page: 1, limit: 10 });

      expect(result.data[0].title).toBe('Test Movie');
      expect(result.total).toBe(1);
    });
  });

  describe('getTVSeriesStats', () => {
    it('should return TV series stats', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTVSeries], 1]),
      };
      const mockAuditQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      };

      jest.spyOn(tvseriesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTVSeriesStats({ page: 1, limit: 10 });

      expect(result.data[0].title).toBe('Test Movie');
      expect(result.total).toBe(1);
    });
  });

  describe('getCategoriesStats', () => {
    it('should return categories stats', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockCategory], 1]),
      };
      const mockAuditQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      };
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);

      jest.spyOn(categoryRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getCategoriesStats({ page: 1, limit: 10 });

      expect(result.data[0].title).toBe('Action');
      expect(result.total).toBe(1);
    });
  });

  describe('getTrendingMovies', () => {
    it('should return trending movies', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockMovie]),
      };
      const mockAuditQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      };

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTrendingMovies({ page: 1, limit: 10 });

      expect(result.data[0].title).toBe('Test Movie');
      expect(result.total).toBe(1);
    });
  });

  describe('getTrendingTVSeries', () => {
    it('should return trending TV series', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTVSeries]),
      };
      const mockAuditQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      };

      jest.spyOn(tvseriesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTrendingTVSeries({ page: 1, limit: 10 });

      expect(result.data[0].title).toBe('Test Movie');
      expect(result.total).toBe(1);
    });
  });

  describe('getUserStats', () => {
    it('should return user stats', async () => {
      const mockAuditQB = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '100' }),
      };

      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getUserStats();

      expect(result.summary.totalUsers).toBe(100);
    });
  });
});
