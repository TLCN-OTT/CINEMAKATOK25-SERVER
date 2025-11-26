import { Brackets, Repository } from 'typeorm';

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

  // --- Distinct Mock Data for Sorting Tests ---
  const mockMetaData1 = {
    id: 'm1',
    title: 'A Movie',
    viewCount: 100,
    avgRating: 2.0,
    thumbnail: 't1.jpg',
  } as any;
  const mockMetaData2 = {
    id: 'm2',
    title: 'B Movie',
    viewCount: 200,
    avgRating: 4.0,
    thumbnail: 't2.jpg',
  } as any;
  const mockMetaData3 = {
    id: 'm3',
    title: 'C Movie',
    viewCount: 50,
    avgRating: 5.0,
    thumbnail: 't3.jpg',
  } as any;

  const mockMovie1 = { id: 'movie-1', metaData: mockMetaData1 } as any;
  const mockMovie2 = { id: 'movie-2', metaData: mockMetaData2 } as any;
  const mockMovie3 = { id: 'movie-3', metaData: mockMetaData3 } as any;

  // --- Helper to create chainable QueryBuilder mocks ---
  const createMockQueryBuilder = (items: any[] = [], count = 0) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([items, count]),
    getMany: jest.fn().mockResolvedValue(items),
    getCount: jest.fn().mockResolvedValue(count),
    getRawOne: jest.fn().mockResolvedValue({ count: '10' }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(EntityMovie), useValue: { createQueryBuilder: jest.fn() } },
        {
          provide: getRepositoryToken(EntityTVSeries),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(EntityCategory),
          useValue: { createQueryBuilder: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(EntityWatchProgress),
          useValue: { createQueryBuilder: jest.fn() },
        },
        { provide: getRepositoryToken(AuditLog), useValue: { createQueryBuilder: jest.fn() } },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    movieRepository = module.get<Repository<EntityMovie>>(getRepositoryToken(EntityMovie));
    tvseriesRepository = module.get<Repository<EntityTVSeries>>(getRepositoryToken(EntityTVSeries));
    categoryRepository = module.get<Repository<EntityCategory>>(getRepositoryToken(EntityCategory));
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));

    jest.clearAllMocks();
  });

  // =================================================================
  // 1. GetMoviesStats (Sorting & Searching Coverage)
  // =================================================================
  describe('getMoviesStats', () => {
    it('should sort by VIEWS descending', async () => {
      // Mock items with different views
      const mockMovieQB = createMockQueryBuilder([mockMovie1, mockMovie2], 2);
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getMoviesStats({ sort: JSON.stringify({ views: 'DESC' }) });

      expect(result.data[0].id).toBe('movie-2'); // 200 views
      expect(result.data[1].id).toBe('movie-1'); // 100 views
    });

    it('should sort by TITLE ascending', async () => {
      const mockMovieQB = createMockQueryBuilder([mockMovie2, mockMovie1], 2); // B, A
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getMoviesStats({ sort: JSON.stringify({ title: 'ASC' }) });

      // Expect sorting logic to swap them to A, B
      expect(result.data[0].title).toBe('A Movie');
      expect(result.data[1].title).toBe('B Movie');
    });

    it('should sort by CHANGE (Calculated field)', async () => {
      const mockMovieQB = createMockQueryBuilder([mockMovie1, mockMovie2], 2);

      // Mock AuditLog counts to create different "change" percentages
      const mockAuditQB = createMockQueryBuilder();
      mockAuditQB.getCount
        // Movie 1: Recent=20, Previous=10 -> +100%
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(10)
        // Movie 2: Recent=5, Previous=10 -> -50%
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10);

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getMoviesStats({ sort: JSON.stringify({ change: 'DESC' }) });

      expect(result.data[0].id).toBe('movie-1'); // +100%
      expect(result.data[1].id).toBe('movie-2'); // -50%
    });

    it('should handle search correctly', async () => {
      const mockMovieQB = createMockQueryBuilder([mockMovie1], 1);
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      await service.getMoviesStats({
        search: JSON.stringify({ title: 'A Movie', releaseDate: '2024' }),
      });

      // Verify query construction for search
      expect(mockMovieQB.where).toHaveBeenCalled();
      expect(mockMovieQB.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('similarity'),
        'rank',
      );
    });
  });

  // =================================================================
  // 2. GetTVSeriesStats (Sorting Coverage)
  // =================================================================
  describe('getTVSeriesStats', () => {
    it('should sort by VIEWS', async () => {
      const mockTV1 = { id: 'tv1', metaData: mockMetaData1 };
      const mockTV2 = { id: 'tv2', metaData: mockMetaData2 };
      const mockQB = createMockQueryBuilder([mockTV1, mockTV2], 2);
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(tvseriesRepository, 'createQueryBuilder').mockReturnValue(mockQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTVSeriesStats({ sort: JSON.stringify({ views: 'DESC' }) });

      expect(result.data[0].id).toBe('tv2'); // 200 views
    });

    it('should sort by TITLE', async () => {
      const mockTV1 = { id: 'tv1', metaData: mockMetaData1 }; // A
      const mockTV2 = { id: 'tv2', metaData: mockMetaData2 }; // B
      const mockQB = createMockQueryBuilder([mockTV2, mockTV1], 2);
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(tvseriesRepository, 'createQueryBuilder').mockReturnValue(mockQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTVSeriesStats({ sort: JSON.stringify({ title: 'ASC' }) });

      expect(result.data[0].title).toBe('A Movie');
    });

    it('should sort by CHANGE', async () => {
      const mockTV1 = { id: 'tv1', metaData: mockMetaData1 };
      const mockTV2 = { id: 'tv2', metaData: mockMetaData2 };
      const mockQB = createMockQueryBuilder([mockTV1, mockTV2], 2);

      const mockAuditQB = createMockQueryBuilder();
      mockAuditQB.getCount
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(10) // tv1: +900%
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10); // tv2: +0%

      jest.spyOn(tvseriesRepository, 'createQueryBuilder').mockReturnValue(mockQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTVSeriesStats({ sort: JSON.stringify({ change: 'DESC' }) });
      expect(result.data[0].id).toBe('tv1');
    });
  });

  // =================================================================
  // 3. GetCategoriesStats (Sorting Coverage)
  // =================================================================
  describe('getCategoriesStats', () => {
    const cat1 = { id: 'c1', categoryName: 'Action', contents: [mockMetaData1] }; // 100 views
    const cat2 = { id: 'c2', categoryName: 'Comedy', contents: [mockMetaData2] }; // 200 views

    beforeEach(() => {
      // calculateCategoryTrending uses findOne to get contents
      jest.spyOn(categoryRepository, 'findOne').mockImplementation(async ({ where }: any) => {
        if (where.id === 'c1') return cat1 as unknown as EntityCategory;
        if (where.id === 'c2') return cat2 as unknown as EntityCategory;
        return null;
      });
    });

    it('should sort by VIEWS', async () => {
      const mockQB = createMockQueryBuilder([cat1, cat2], 2);
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(categoryRepository, 'createQueryBuilder').mockReturnValue(mockQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getCategoriesStats({ sort: JSON.stringify({ views: 'DESC' }) });
      expect(result.data[0].title).toBe('Comedy'); // 200 views
    });

    it('should sort by TITLE', async () => {
      const mockQB = createMockQueryBuilder([cat2, cat1], 2);
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(categoryRepository, 'createQueryBuilder').mockReturnValue(mockQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getCategoriesStats({ sort: JSON.stringify({ title: 'ASC' }) });
      expect(result.data[0].title).toBe('Action');
    });

    it('should sort by CHANGE', async () => {
      const mockQB = createMockQueryBuilder([cat1, cat2], 2);
      const mockAuditQB = createMockQueryBuilder();
      mockAuditQB.getCount.mockResolvedValue(10); // Equal change for simplicity

      jest.spyOn(categoryRepository, 'createQueryBuilder').mockReturnValue(mockQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getCategoriesStats({ sort: JSON.stringify({ change: 'DESC' }) });
      expect(result.data).toBeDefined();
    });
  });

  // =================================================================
  // 4. GetTrendingMovies (Sort & In-Memory Search Coverage)
  // =================================================================
  describe('getTrendingMovies', () => {
    it('should sort by ENGAGEMENT score', async () => {
      const mockMovieQB = createMockQueryBuilder([mockMovie1, mockMovie2], 2);

      // Mock AuditLog to return different engagement counts
      const mockAuditQB = createMockQueryBuilder();
      // calculateTrending (m1)
      mockAuditQB.getCount.mockResolvedValueOnce(10).mockResolvedValueOnce(10);
      // calculateEngagement (m1) -> returns 80 (80/100 * 100)
      mockAuditQB.getCount.mockResolvedValueOnce(80).mockResolvedValueOnce(100);

      // calculateTrending (m2)
      mockAuditQB.getCount.mockResolvedValueOnce(10).mockResolvedValueOnce(10);
      // calculateEngagement (m2) -> returns 20 (20/100 * 100)
      mockAuditQB.getCount.mockResolvedValueOnce(20).mockResolvedValueOnce(100);

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTrendingMovies({
        sort: JSON.stringify({ engagement: 'DESC' }),
      });

      // m1 has higher engagement
      expect(result.data[0].id).toBe('movie-1');
    });

    it('should sort by RATING', async () => {
      const mockMovieQB = createMockQueryBuilder([mockMovie1, mockMovie2], 2); // m1: 2.0, m2: 4.0
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTrendingMovies({ sort: JSON.stringify({ rating: 'DESC' }) });

      expect(result.data[0].id).toBe('movie-2'); // 4.0 rating
    });

    it('should perform in-memory search by TITLE', async () => {
      const mockMovieQB = createMockQueryBuilder([mockMovie1, mockMovie2], 2);
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTrendingMovies({
        search: JSON.stringify({ title: 'B Movie' }),
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('B Movie');
    });

    it('should handle in-memory search with no matches', async () => {
      const mockMovieQB = createMockQueryBuilder([mockMovie1], 1);
      const mockAuditQB = createMockQueryBuilder([], 10);
      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTrendingMovies({
        search: JSON.stringify({ title: 'Z Movie' }),
      });
      expect(result.data).toHaveLength(0);
    });
  });

  // =================================================================
  // 5. GetTrendingTVSeries (Sort & Search)
  // =================================================================
  describe('getTrendingTVSeries', () => {
    const mockTV1 = { id: 'tv1', metaData: mockMetaData1 };
    const mockTV2 = { id: 'tv2', metaData: mockMetaData2 };

    it('should sort by CHANGE', async () => {
      const mockQB = createMockQueryBuilder([mockTV1, mockTV2], 2);

      const mockAuditQB = createMockQueryBuilder();
      // TV1: Trending (+100%)
      mockAuditQB.getCount.mockResolvedValueOnce(20).mockResolvedValueOnce(10);
      // TV1: Engagement
      mockAuditQB.getCount.mockResolvedValueOnce(10).mockResolvedValueOnce(100);

      // TV2: Trending (0%)
      mockAuditQB.getCount.mockResolvedValueOnce(10).mockResolvedValueOnce(10);
      // TV2: Engagement
      mockAuditQB.getCount.mockResolvedValueOnce(10).mockResolvedValueOnce(100);

      jest.spyOn(tvseriesRepository, 'createQueryBuilder').mockReturnValue(mockQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTrendingTVSeries({
        sort: JSON.stringify({ change: 'DESC' }),
      });

      expect(result.data[0].id).toBe('tv1');
    });

    it('should sort by TITLE', async () => {
      const mockQB = createMockQueryBuilder([mockTV2, mockTV1], 2);
      const mockAuditQB = createMockQueryBuilder([], 10);

      jest.spyOn(tvseriesRepository, 'createQueryBuilder').mockReturnValue(mockQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTrendingTVSeries({ sort: JSON.stringify({ title: 'ASC' }) });

      expect(result.data[0].title).toBe('A Movie');
    });
  });

  // =================================================================
  // 6. Error Handling & Edge Cases
  // =================================================================
  describe('Error Handling', () => {
    it('should handle database errors gracefully in getMoviesStats', async () => {
      const mockMovieQB = createMockQueryBuilder([mockMovie1], 1);
      // Force DB error
      mockMovieQB.getManyAndCount.mockRejectedValue(new Error('DB Error'));
      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);

      await expect(service.getMoviesStats({})).rejects.toThrow('DB Error');
    });

    it('should return 0 engagement if calculation fails', async () => {
      // In `calculateEngagement`, if error occurs, it returns 0
      // We can test this by making getTrendingMovies call where audit log throws inside the loop
      const mockMovieQB = createMockQueryBuilder([mockMovie1], 1);
      const mockAuditQB = createMockQueryBuilder();
      // Trending succeeds
      mockAuditQB.getCount.mockResolvedValueOnce(10).mockResolvedValueOnce(10);
      // Engagement fails
      mockAuditQB.getCount.mockRejectedValue(new Error('Engagement DB Error'));

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getTrendingMovies({});
      // Ensure it didn't crash, and engagement is 0 (or undefined if interface hides it)
      // Based on code, cleaned data removes 'engagementScore' but keeps 'engagement'
      expect(result.data[0].engagement).toBe(0);
    });

    it('should return default trending data if calculation fails', async () => {
      // In `calculateTrending`, if error occurs, returns { up, +0.0% }
      const mockMovieQB = createMockQueryBuilder([mockMovie1], 1);
      const mockAuditQB = createMockQueryBuilder();
      // Trending fails
      mockAuditQB.getCount.mockRejectedValue(new Error('Trending DB Error'));

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getMoviesStats({});
      expect(result.data[0].change).toBe('+0.0%');
    });
  });

  describe('Internal Logic (Parsing)', () => {
    it('should handle change string parsing edge cases', async () => {
      // Testing indirectly via sorting with change values
      // "+66.7%" -> 66.7
      // "-50%" -> -50
      // "0%" -> 0
      // invalid -> 0
      const mockMovieQB = createMockQueryBuilder([mockMovie1, mockMovie2, mockMovie3], 3);
      const mockAuditQB = createMockQueryBuilder();
      // M1: +60%
      mockAuditQB.getCount.mockResolvedValueOnce(160).mockResolvedValueOnce(100);
      // M2: -50%
      mockAuditQB.getCount.mockResolvedValueOnce(50).mockResolvedValueOnce(100);
      // M3: Error -> +0.0%
      mockAuditQB.getCount.mockRejectedValueOnce(new Error());

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockMovieQB as any);
      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockAuditQB as any);

      const result = await service.getMoviesStats({ sort: JSON.stringify({ change: 'DESC' }) });

      expect(result.data[0].id).toBe('movie-1'); // +60
      expect(result.data[1].id).toBe('movie-3'); // +0
      expect(result.data[2].id).toBe('movie-2'); // -50
    });
  });
});
