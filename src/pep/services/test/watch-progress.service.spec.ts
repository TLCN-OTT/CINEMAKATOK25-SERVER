import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { VideoService } from '../../../cms/services/video.service';
import { CreateWatchProgressDto, UpdateWatchProgressDto } from '../../dtos/watch-progress.dto';
import { EntityWatchProgress } from '../../entities/watch-progress.entity';
import { WatchProgressService } from '../watch-progress.service';

describe('WatchProgressService', () => {
  let service: WatchProgressService;
  let watchProgressRepository: Repository<EntityWatchProgress>;
  let videoService: VideoService;

  // --- Mock Data ---
  const mockVideoMovie = {
    id: 'video-movie',
    videoUrl: 'movie.mp4',
    thumbnailUrl: 'thumb-movie.jpg',
    ownerType: 'movie',
    ownerId: 'movie-1',
  } as any;

  const mockVideoEpisode = {
    id: 'video-episode',
    videoUrl: 'episode.mp4',
    thumbnailUrl: 'thumb-episode.jpg',
    ownerType: 'episode',
    ownerId: 'episode-1',
  } as any;

  const mockVideoUnknown = {
    id: 'video-unknown',
    ownerType: 'clip',
    ownerId: 'clip-1',
  } as any;

  const mockWatchProgress = {
    id: 'wp-1',
    user: { id: 'user-1' },
    video: mockVideoMovie,
    watchedDuration: 120,
    lastWatched: new Date(),
    isCompleted: false,
  } as any;

  const mockEpisodeEntity = {
    id: 'episode-1',
    episodeDuration: 45,
    episodeNumber: 1,
    season: {
      seasonNumber: 1,
      tvseries: {
        id: 'tv-1',
        metaData: {
          id: 'meta-tv',
          title: 'TV Series Title',
          description: 'TV Desc',
          thumbnail: 'tv-thumb.jpg',
          type: 'TVSERIES',
        },
      },
    },
  } as any;

  const mockMovieEntity = {
    id: 'movie-1',
    duration: 120,
    metaData: {
      id: 'meta-movie',
      title: 'Movie Title',
      description: 'Movie Desc',
      thumbnail: 'movie-thumb.jpg',
      type: 'MOVIE',
    },
  } as any;

  // --- Mocks ---
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
  };

  const mockManagerQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchProgressService,
        {
          provide: getRepositoryToken(EntityWatchProgress),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            manager: {
              createQueryBuilder: jest.fn(() => mockManagerQueryBuilder),
            },
          },
        },
        {
          provide: VideoService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WatchProgressService>(WatchProgressService);
    watchProgressRepository = module.get<Repository<EntityWatchProgress>>(
      getRepositoryToken(EntityWatchProgress),
    );
    videoService = module.get<VideoService>(VideoService);

    jest.clearAllMocks();
  });

  // =================================================================
  // 1. Tests for updateWatchProgress
  // =================================================================
  describe('updateWatchProgress', () => {
    const createDto: CreateWatchProgressDto = { videoId: 'video-movie', watchedDuration: 100 };

    it('should create new watch progress if not exists', async () => {
      jest.spyOn(videoService, 'findOne').mockResolvedValue(mockVideoMovie);
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(watchProgressRepository, 'create').mockReturnValue(mockWatchProgress);
      jest.spyOn(watchProgressRepository, 'save').mockResolvedValue(mockWatchProgress);

      const result = await service.updateWatchProgress('user-1', createDto);

      expect(result).toEqual(mockWatchProgress);
      expect(watchProgressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ watchedDuration: 100 }),
      );
    });

    it('should update existing watch progress', async () => {
      jest.spyOn(videoService, 'findOne').mockResolvedValue(mockVideoMovie);
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(mockWatchProgress);
      jest.spyOn(watchProgressRepository, 'save').mockImplementation(async entity => entity as any);

      const result = await service.updateWatchProgress('user-1', createDto);

      expect(result.watchedDuration).toBe(100);
      expect(watchProgressRepository.create).not.toHaveBeenCalled();
      expect(watchProgressRepository.save).toHaveBeenCalled();
    });
  });

  // =================================================================
  // 2. Tests for updateProgress
  // =================================================================
  describe('updateProgress', () => {
    it('should update both duration and completion status', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue({ ...mockWatchProgress });
      jest.spyOn(watchProgressRepository, 'save').mockImplementation(async entity => entity as any);

      const dto: UpdateWatchProgressDto = { watchedDuration: 200, isCompleted: true };
      const result = await service.updateProgress('user-1', 'video-1', dto);

      expect(result.watchedDuration).toBe(200);
      expect(result.isCompleted).toBe(true);
    });

    it('should update only watchedDuration', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue({ ...mockWatchProgress });
      jest.spyOn(watchProgressRepository, 'save').mockImplementation(async entity => entity as any);

      const dto: UpdateWatchProgressDto = { watchedDuration: 50 };
      const result = await service.updateProgress('user-1', 'video-1', dto);

      expect(result.watchedDuration).toBe(50);
      // isCompleted should remain unchanged (mockWatchProgress.isCompleted is false)
      expect(result.isCompleted).toBe(false);
    });

    it('should update only isCompleted', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue({ ...mockWatchProgress });
      jest.spyOn(watchProgressRepository, 'save').mockImplementation(async entity => entity as any);

      const dto: UpdateWatchProgressDto = { isCompleted: true };
      const result = await service.updateProgress('user-1', 'video-1', dto);

      // watchedDuration should remain unchanged
      expect(result.watchedDuration).toBe(mockWatchProgress.watchedDuration);
      expect(result.isCompleted).toBe(true);
    });

    it('should throw NotFoundException if progress not found', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateProgress('user-1', 'video-1', { watchedDuration: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =================================================================
  // 3. Tests for Simple Getters
  // =================================================================
  describe('getWatchProgress', () => {
    it('should return watch progress', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(mockWatchProgress);
      const result = await service.getWatchProgress('user-1', 'video-1');
      expect(result).toEqual(mockWatchProgress);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);
      await expect(service.getWatchProgress('user-1', 'video-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getResumeData', () => {
    it('should return resume data', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(mockWatchProgress);
      const result = await service.getResumeData('user-1', 'video-1');
      expect(result).toEqual({
        videoId: mockWatchProgress.video.id,
        contentTitle: mockWatchProgress.video.videoUrl,
        contentThumbnail: mockWatchProgress.video.thumbnailUrl,
        watchedDuration: mockWatchProgress.watchedDuration,
        lastWatched: mockWatchProgress.lastWatched,
        isCompleted: mockWatchProgress.isCompleted,
      });
    });

    it('should return null if no progress found', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);
      const result = await service.getResumeData('user-1', 'video-1');
      expect(result).toBeNull();
    });
  });

  // =================================================================
  // 4. Tests for getWatchProgressByUser (Complex)
  // =================================================================
  describe('getWatchProgressByUser', () => {
    const mockProgressMovie = { ...mockWatchProgress, video: mockVideoMovie };
    const mockProgressEpisode = { ...mockWatchProgress, video: mockVideoEpisode };
    const mockProgressUnknown = { ...mockWatchProgress, video: mockVideoUnknown };

    it('should return enriched data handling Movie, Episode, and Unknown types', async () => {
      // Mock findAll return list containing all 3 types
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [mockProgressEpisode, mockProgressMovie, mockProgressUnknown],
        3,
      ]);

      // Mock Enrichment calls
      // The service iterates and calls manager.createQueryBuilder...getOne()
      // Call 1: Episode -> found
      // Call 2: Movie -> found
      // Call 3: Unknown -> logic doesn't query DB
      mockManagerQueryBuilder.getOne
        .mockResolvedValueOnce(mockEpisodeEntity) // For Episode
        .mockResolvedValueOnce(mockMovieEntity); // For Movie

      const result = await service.getWatchProgressByUser('user-1', { page: 1 });

      //  - This visualizes how the loop maps entities

      expect(result.total).toBe(3);

      // Check Episode Enrichment
      const epResult = result.data[0];
      expect(epResult.contentTitle).toBe('TV Series Title');
      expect(epResult.episodeNumber).toBe(1);

      // Check Movie Enrichment
      const movResult = result.data[1];
      expect(movResult.contentTitle).toBe('Movie Title');
      expect(movResult.duration).toBe(120);

      // Check Unknown Enrichment
      const unkResult = result.data[2];
      expect(unkResult.contentTitle).toBeNull();
      expect(unkResult.metadata).toBeNull();
    });

    it('should handle filters and custom sort', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getWatchProgressByUser('user-1', {
        isCompleted: true,
        sort: JSON.stringify({ lastWatched: 'ASC' }),
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('wp.isCompleted = :isCompleted', {
        isCompleted: true,
      });
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('wp.lastWatched', 'ASC');
    });

    it('should use default sort if not provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.getWatchProgressByUser('user-1', {});
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('wp.lastWatched', 'DESC');
    });

    it('should handle database errors during enrichment gracefully (try/catch)', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProgressMovie], 1]);

      // Simulate error during manager query
      mockManagerQueryBuilder.getOne.mockRejectedValue(new Error('DB connection failed'));

      const result = await service.getWatchProgressByUser('user-1', {});

      // Should return data without enrichment, not throw
      expect(result.data[0].contentTitle).toBeNull();
      expect(result.data[0].metadata).toBeNull();
    });
  });

  // =================================================================
  // 5. Other List Methods
  // =================================================================
  describe('getWatchHistory', () => {
    it('should return history with default sort', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockWatchProgress], 1]);
      const result = await service.getWatchHistory('user-1', {});

      expect(result.data).toEqual([mockWatchProgress]);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('wp.lastWatched', 'DESC');
    });

    it('should return history with custom sort', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.getWatchHistory('user-1', {
        sort: JSON.stringify({ watchedDuration: 'DESC' }),
      });

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('wp.watchedDuration', 'DESC');
    });
  });

  describe('getRecentlyWatched', () => {
    it('should return recently watched list', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockWatchProgress]);

      const result = await service.getRecentlyWatched('user-1', 5);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result).toEqual([mockWatchProgress]);
    });
  });

  // =================================================================
  // 6. State Change Methods
  // =================================================================
  describe('markAsCompleted', () => {
    it('should mark as completed', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(mockWatchProgress);
      jest.spyOn(watchProgressRepository, 'save').mockImplementation(async entity => entity as any);

      const result = await service.markAsCompleted('user-1', 'video-1');

      expect(result.isCompleted).toBe(true);
      expect(watchProgressRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);
      await expect(service.markAsCompleted('user-1', 'video-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWatchProgress', () => {
    it('should delete watch progress', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(mockWatchProgress);
      jest.spyOn(watchProgressRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteWatchProgress('user-1', 'video-1');

      expect(result.message).toContain('deleted successfully');
      expect(watchProgressRepository.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);
      await expect(service.deleteWatchProgress('user-1', 'video-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
