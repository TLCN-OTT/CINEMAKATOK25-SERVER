import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { VIDEO_STATUS } from '@app/common/enums/global.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateTVSeriesDto, UpdateTVSeriesDto } from '../../dtos/tvseries.dto';
import { ContentType } from '../../entities/content.entity';
import { EntityEpisode, EntitySeason, EntityTVSeries } from '../../entities/tvseries.entity';
import { EntityVideo, VideoOwnerType } from '../../entities/video.entity';
import { ContentService } from '../content.service';
import { TvSeriesService } from '../tvseries.service';
import { VideoService } from '../video.service';

describe('TvSeriesService', () => {
  let service: TvSeriesService;
  let tvSeriesRepository: Repository<EntityTVSeries>;
  let seasonRepository: Repository<EntitySeason>;
  let episodeRepository: Repository<EntityEpisode>;
  let contentService: ContentService;
  let videoService: VideoService;

  // --- Mock Data ---
  const mockDate = new Date('2023-01-01T00:00:00.000Z');

  const mockContent = {
    id: 'content-1',
    title: 'Test TV Series',
    description: 'Description',
    releaseDate: mockDate,
    categories: [{ id: 'cat-1' }],
    tags: [{ id: 'tag-1' }],
    actors: [{ id: 'actor-1' }],
    directors: [{ id: 'director-1' }],
    avgRating: 4.5,
    viewCount: 100,
  } as any;

  const mockVideo = { id: 'video-1', status: VIDEO_STATUS.READY, ownerId: 'episode-1' } as any;

  const mockEpisode = {
    id: 'episode-1',
    episodeNumber: 1,
    createdAt: mockDate,
    video: mockVideo,
    season: { id: 'season-1' },
  } as any;

  const mockSeason = {
    id: 'season-1',
    seasonNumber: 1,
    episodes: [mockEpisode],
    totalEpisodes: 1,
    tvseries: { id: 'tv-1' },
  } as any;

  const mockTVSeries = {
    id: 'tv-1',
    metaData: mockContent,
    seasons: [mockSeason],
    createdAt: mockDate,
  } as any;

  // --- Mock Objects ---
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockTVSeries], 1]),
    getOne: jest.fn().mockResolvedValue(mockTVSeries),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn().mockImplementation(entity => {
        if (Array.isArray(entity)) return entity.map((e, i) => ({ ...e, id: e.id || `new-${i}` }));
        return { ...entity, id: entity.id || 'new-id' };
      }),
      delete: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TvSeriesService,
        {
          provide: getRepositoryToken(EntityTVSeries),
          useValue: {
            create: jest.fn().mockReturnValue(mockTVSeries),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            manager: {
              connection: {
                createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
              },
            },
          },
        },
        {
          provide: getRepositoryToken(EntitySeason),
          useValue: {
            create: jest.fn().mockImplementation(dto => ({ ...dto, id: 'new-season-id' })),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            target: 'EntitySeason',
          },
        },
        {
          provide: getRepositoryToken(EntityEpisode),
          useValue: {
            create: jest.fn().mockImplementation(dto => ({ ...dto, id: 'new-episode-id' })),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            target: 'EntityEpisode',
          },
        },
        {
          provide: ContentService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: VideoService,
          useValue: {
            validateVideos: jest.fn(),
            assignVideos: jest.fn(),
            findByEpisodeIds: jest.fn(),
            findByOwner: jest.fn(),
            unassignVideosByEpisodeIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TvSeriesService>(TvSeriesService);
    tvSeriesRepository = module.get<Repository<EntityTVSeries>>(getRepositoryToken(EntityTVSeries));
    seasonRepository = module.get<Repository<EntitySeason>>(getRepositoryToken(EntitySeason));
    episodeRepository = module.get<Repository<EntityEpisode>>(getRepositoryToken(EntityEpisode));
    contentService = module.get<ContentService>(ContentService);
    videoService = module.get<VideoService>(VideoService);

    jest.clearAllMocks();
  });

  // ==========================
  // 1. Tests for Query Building & Filters
  // ==========================
  describe('Query Filters & Sorting (_buildSeriesQuery)', () => {
    it('should apply "today" filter correctly', async () => {
      await service.findAll({ filter: JSON.stringify({ range: 'today' }) });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'metaData.releaseDate >= :startDate',
        expect.anything(),
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'metaData.releaseDate <= :endDate',
        expect.anything(),
      );
    });

    it('should apply "week" filter correctly', async () => {
      await service.findAll({ filter: JSON.stringify({ range: 'week' }) });
      // Range week logic sets start and end date
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'metaData.releaseDate >= :startDate',
        expect.anything(),
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'metaData.releaseDate <= :endDate',
        expect.anything(),
      );
    });

    it('should apply "month" filter correctly', async () => {
      await service.findAll({ filter: JSON.stringify({ range: 'month' }) });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'metaData.releaseDate >= :startDate',
        expect.anything(),
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'metaData.releaseDate <= :endDate',
        expect.anything(),
      );
    });

    it('should apply "year" filter correctly', async () => {
      await service.findAll({ filter: JSON.stringify({ range: 'year' }) });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'metaData.releaseDate >= :startDate',
        expect.anything(),
      );
    });

    it('should handle sort object with specific fields', async () => {
      const sort = JSON.stringify({
        viewCount: 'DESC',
        avgRating: 'ASC',
        releaseDate: 'DESC',
        other: 'ASC',
      });
      await service.findAll({ sort });
      // Covers: if (['viewCount', 'avgRating', 'releaseDate'].includes(key))
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('metaData.viewCount', 'DESC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('metaData.avgRating', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('metaData.releaseDate', 'DESC');
      // Covers: else (tvseries.key)
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('tvseries.other', 'ASC');
    });

    it('should NOT apply default order if search is present', async () => {
      await service.findAll({ search: 'something' });
      // When searching, we order by rank, so defaultOrder block should be skipped
      // check if defaultOrder 'tvseries.metaData.releaseDate' was NOT called
      const calls = mockQueryBuilder.orderBy.mock.calls.map(c => c[0]);
      expect(calls).not.toContain('tvseries.metaData.releaseDate');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('rank', 'DESC');
    });

    it('should apply default order if NO search and NO sort', async () => {
      await service.findAll({}); // Empty query
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'tvseries.metaData.releaseDate',
        'DESC',
      );
    });
  });

  // ==========================
  // 2. Tests for Logic Branches
  // ==========================

  describe('_attachVideosToEpisodes', () => {
    it('should return immediately if series has no episodes', async () => {
      const emptySeries = { ...mockTVSeries, seasons: [] };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[emptySeries], 1]);

      await service.findAll();

      // Video service should NOT be called because episodeIds array is empty
      expect(videoService.findByEpisodeIds).not.toHaveBeenCalled();
    });
  });

  describe('findTvSeriesWithNewEpisodes', () => {
    it('should handle series with no seasons/episodes gracefully', async () => {
      const seriesNoSeasons = { ...mockTVSeries, seasons: [] };
      const seriesEmptySeasons = { ...mockTVSeries, seasons: [{ episodes: [] }] };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [seriesNoSeasons, seriesEmptySeasons],
        2,
      ]);

      const result = await service.findTvSeriesWithNewEpisodes();

      expect(result.data[0].latestEpisode).toBeNull();
      expect(result.data[1].latestEpisode).toBeNull();
    });
  });

  describe('getTVSeriesRecommendationsFromTVSeriesId', () => {
    it('should skip weight calculation blocks if metadata is missing', async () => {
      const sparseSeries = { id: 'tv-1', metaData: { id: 'c-1' } }; // No title, desc, actors...
      mockQueryBuilder.getOne.mockResolvedValue(sparseSeries);

      await service.getTVSeriesRecommendationsFromTVSeriesId('tv-1');

      // Verify "if (tvseries.metaData?.description)" block was skipped
      // Verify "if (categoryIds.length > 0)" block was skipped
      // We check this by seeing if parameters were NOT set
      expect(mockQueryBuilder.setParameters).toHaveBeenCalledWith({
        tvSeriesId: 'tv-1',
        // Description, Title, Categories... should be missing from params
      });
    });
  });

  // ==========================
  // 3. Tests for Create (Edge Cases)
  // ==========================
  describe('create', () => {
    it('should create series WITHOUT seasons', async () => {
      jest.spyOn(contentService, 'create').mockResolvedValue(mockContent);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTVSeries);

      await service.create({
        metaData: { title: 'No Season' } as any,
        seasons: [],
      });

      // Verify season repository was NOT called
      expect(seasonRepository.create).not.toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(1); // Only TV Series
    });

    it('should create episode WITHOUT video', async () => {
      const createDto: CreateTVSeriesDto = {
        metaData: { title: 'Test' } as any,
        seasons: [{ seasonNumber: 1, episodes: [{ episodeNumber: 1 }] as any }],
      };
      jest.spyOn(contentService, 'create').mockResolvedValue(mockContent);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTVSeries);

      await service.create(createDto);

      // Verify video assignment was skipped
      expect(videoService.validateVideos).not.toHaveBeenCalled();
      expect(videoService.assignVideos).not.toHaveBeenCalled();
    });

    it('should throw BadRequest if video ID provided but video not found in DB', async () => {
      const createDto = {
        metaData: { title: 'Test' } as any,
        seasons: [
          {
            seasonNumber: 1,
            episodes: [{ episodeNumber: 1, video: { id: 'fake-id' } as any }],
          },
        ],
      };
      jest.spyOn(contentService, 'create').mockResolvedValue(mockContent);
      // Validate returns empty -> Video not found
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([]);

      await expect(service.create(createDto as CreateTVSeriesDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequest if video object provided but ID is missing', async () => {
      const createDto = {
        metaData: { title: 'Test' } as any,
        seasons: [
          {
            seasonNumber: 1,
            episodes: [{ episodeNumber: 1, video: {} as any }],
          },
        ],
      };
      jest.spyOn(contentService, 'create').mockResolvedValue(mockContent);
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([]);

      await expect(service.create(createDto as CreateTVSeriesDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ==========================
  // 4. Tests for Update (Complex Branching)
  // ==========================
  describe('update', () => {
    beforeEach(() => {
      // Setup default mocks for update flow
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTVSeries);
      jest.spyOn(seasonRepository, 'findOne').mockResolvedValue(mockSeason);
      jest.spyOn(episodeRepository, 'findOne').mockResolvedValue(mockEpisode);
      mockQueryRunner.manager.findOne.mockResolvedValue(mockEpisode);
      mockQueryRunner.manager.find.mockResolvedValue([]);
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([{ id: 'new-vid' } as any]);
      jest.spyOn(videoService, 'findByEpisodeIds').mockResolvedValue([mockVideo]);
      jest.spyOn(seasonRepository, 'find').mockResolvedValue([]);
      jest.spyOn(episodeRepository, 'find').mockResolvedValue([]);
    });

    it('should update metadata ONLY (no seasons provided)', async () => {
      await service.update('tv-1', {
        metaData: { title: 'New Title' } as any,
        seasons: [],
      });

      expect(contentService.update).toHaveBeenCalled();
      expect(seasonRepository.create).not.toHaveBeenCalled(); // Skipping season logic
    });

    it('should delete ALL seasons if empty array provided', async () => {
      jest.spyOn(seasonRepository, 'find').mockResolvedValue([mockSeason]);
      jest.spyOn(episodeRepository, 'find').mockResolvedValue([mockEpisode]);

      await service.update('tv-1', {
        seasons: [],
        metaData: {} as any,
      }); // Empty array

      // Expect delete called
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining(['season-1']), // The ID from mockSeason
      );
    });

    it('should DELETE specific season and episode', async () => {
      // TV Series has [season-1, season-2]
      const season2 = { ...mockSeason, id: 'season-2' };
      const tvSeriesWith2Seasons = { ...mockTVSeries, seasons: [mockSeason, season2] };
      jest.spyOn(service, 'findOne').mockResolvedValue(tvSeriesWith2Seasons);

      // Update DTO only contains season-1 -> season-2 should be deleted
      await service.update('tv-1', {
        seasons: [
          {
            id: 'season-1',
            seasonNumber: 1,
            episodes: [],
          },
        ],
        metaData: {} as any,
      });

      // Verify deletion of season-2
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
        expect.anything(),
        ['season-2'], // Expect season-2 to be deleted
      );
    });

    it('should UPDATE existing episode: REMOVE video', async () => {
      // Episode currently has video (mockEpisode has video-1)
      // Request sends episode without video field? Or explicitly null?
      // Logic: if (video) { assign } else { unassign }
      // BUT wait, in loop: "const { video, ...episodeData } = epDto;"
      // If epDto doesn't have video, video is undefined.
      // Logic: if (video) ... else { unassign }

      await service.update('tv-1', {
        seasons: [
          {
            id: 'season-1',
            episodes: [
              {
                id: 'episode-1',
                episodeNumber: 1,
                episodeDuration: 0,
                episodeTitle: '',
              },
            ],
            seasonNumber: 1,
          },
        ],
        metaData: {} as any,
      });

      // Should call unassign
      expect(videoService.unassignVideosByEpisodeIds).toHaveBeenCalledWith(['episode-1']);
      // Should NOT call assign
      expect(videoService.assignVideos).not.toHaveBeenCalled();
    });

    it('should CREATE new episode WITHOUT video', async () => {
      const dto = {
        seasons: [
          {
            id: 'season-1',
            episodes: [{ episodeNumber: 2, episodeDuration: 0, episodeTitle: '' }],
            seasonNumber: 1,
          },
        ],
        metaData: {} as any,
      };
      mockQueryRunner.manager.save.mockResolvedValue({ id: 'new-ep-2' });

      await service.update('tv-1', dto as UpdateTVSeriesDto);

      // Created episode
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ episodeNumber: 2 }),
      );
      // Did not assign video
      expect(videoService.assignVideos).not.toHaveBeenCalled();
    });
  });

  // ==========================
  // 5. Tests for Delete
  // ==========================
  describe('delete', () => {
    it('should skip video deletion if series has no episodes', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(mockTVSeries);
      // Return empty array for episodes
      mockQueryRunner.manager.find.mockResolvedValue([]);

      await service.delete('tv-1');

      // Check that the video delete query was NOT executed
      // mockQueryBuilder.delete() was mocked.
      expect(mockQueryBuilder.delete).not.toHaveBeenCalled();

      // But series removal still happens
      expect(mockQueryRunner.manager.remove).toHaveBeenCalled();
    });
  });

  describe('findByContentId', () => {
    it('should return successfully', async () => {
      jest.spyOn(tvSeriesRepository, 'findOne').mockResolvedValue(mockTVSeries);
      await expect(service.findByContentId('c-1')).resolves.toEqual(mockTVSeries);
    });
    it('should throw NotFound', async () => {
      jest.spyOn(tvSeriesRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findByContentId('c-1')).rejects.toThrow(NotFoundException);
    });
  });
});
