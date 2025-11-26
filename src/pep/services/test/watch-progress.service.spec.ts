import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EntityMovie } from '../../../cms/entities/movie.entity';
import { EntityEpisode, EntitySeason, EntityTVSeries } from '../../../cms/entities/tvseries.entity';
import { EntityVideo } from '../../../cms/entities/video.entity';
import { VideoService } from '../../../cms/services/video.service';
import { CreateWatchProgressDto, UpdateWatchProgressDto } from '../../dtos/watch-progress.dto';
import { EntityWatchProgress } from '../../entities/watch-progress.entity';
import { WatchProgressService } from '../watch-progress.service';

describe('WatchProgressService', () => {
  let service: WatchProgressService;
  let watchProgressRepository: Repository<EntityWatchProgress>;
  let videoService: VideoService;

  const mockVideo = {
    id: 'video-1',
    videoUrl: 'video.mp4',
    thumbnailUrl: 'thumb.jpg',
    ownerType: 'movie' as any, // Cast to avoid type mismatch
    ownerId: 'movie-1',
  } as any;

  let mockWatchProgress: any;

  const mockEpisode = {
    id: 'episode-1',
    episodeDuration: 45,
    episodeNumber: 1,
    season: {
      seasonNumber: 1,
      tvseries: {
        id: 'tv-1',
        metaData: {
          id: 'meta-1',
          title: 'TV Series',
          description: 'Desc',
          thumbnail: 'thumb.jpg',
          banner: 'banner.jpg',
          trailer: 'trailer.mp4',
          type: 'TVSERIES',
          releaseDate: new Date(),
          avgRating: 4.5,
          imdbRating: 8.0,
          maturityRating: 'PG',
          viewCount: 1000,
        },
      },
    },
  } as any;

  const mockMovie = {
    id: 'movie-1',
    duration: 120,
    metaData: {
      id: 'meta-2',
      title: 'Movie Title',
      description: 'Desc',
      thumbnail: 'thumb.jpg',
      banner: 'banner.jpg',
      trailer: 'trailer.mp4',
      type: 'MOVIE',
      releaseDate: new Date(),
      avgRating: 4.0,
      imdbRating: 7.5,
      maturityRating: 'PG-13',
      viewCount: 500,
    },
  } as any;

  beforeEach(async () => {
    mockWatchProgress = {
      id: 'wp-1',
      user: { id: 'user-1' },
      video: mockVideo,
      watchedDuration: 120,
      lastWatched: new Date(),
      isCompleted: false,
    } as any;

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
            createQueryBuilder: jest.fn(),
            manager: {
              createQueryBuilder: jest.fn(),
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

  describe('updateWatchProgress', () => {
    const createDto: CreateWatchProgressDto = { videoId: 'video-1', watchedDuration: 100 };

    it('should create new watch progress if not exists', async () => {
      jest.spyOn(videoService, 'findOne').mockResolvedValue(mockVideo);
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(watchProgressRepository, 'create').mockReturnValue(mockWatchProgress);
      jest.spyOn(watchProgressRepository, 'save').mockResolvedValue(mockWatchProgress);

      const result = await service.updateWatchProgress('user-1', createDto);

      expect(result).toEqual(mockWatchProgress);
      expect(videoService.findOne).toHaveBeenCalledWith('video-1');
      expect(watchProgressRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' }, video: { id: 'video-1' } },
        relations: ['user', 'video'],
      });
      expect(watchProgressRepository.create).toHaveBeenCalled();
      expect(watchProgressRepository.save).toHaveBeenCalled();
    });

    it('should update existing watch progress', async () => {
      jest.spyOn(videoService, 'findOne').mockResolvedValue(mockVideo);
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(mockWatchProgress);
      jest
        .spyOn(watchProgressRepository, 'save')
        .mockResolvedValue({ ...mockWatchProgress, watchedDuration: 100 });

      const result = await service.updateWatchProgress('user-1', createDto);

      expect(result.watchedDuration).toBe(100);
      expect(watchProgressRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateProgress', () => {
    const updateDto: UpdateWatchProgressDto = { watchedDuration: 150, isCompleted: true };

    it('should update watch progress successfully', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(mockWatchProgress);
      jest
        .spyOn(watchProgressRepository, 'save')
        .mockResolvedValue({ ...mockWatchProgress, ...updateDto });

      const result = await service.updateProgress('user-1', 'video-1', updateDto);

      expect(result.watchedDuration).toBe(150);
      expect(result.isCompleted).toBe(true);
      expect(watchProgressRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateProgress('user-1', 'video-1', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

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
        videoId: 'video-1',
        contentTitle: 'video.mp4',
        contentThumbnail: 'thumb.jpg',
        watchedDuration: 120,
        lastWatched: expect.any(Date),
        isCompleted: false,
      });
    });

    it('should return null if no progress', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getResumeData('user-1', 'video-1');

      expect(result).toBe(null);
    });
  });

  describe('getWatchProgressByUser', () => {
    it('should return enriched watch progress data', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockWatchProgress], 1]),
      };
      const mockEpisodeQB = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockEpisode),
      };
      const mockMovieQB = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockMovie),
      };

      jest
        .spyOn(watchProgressRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);
      jest
        .spyOn(watchProgressRepository.manager, 'createQueryBuilder')
        .mockReturnValueOnce(mockMovieQB as any)
        .mockReturnValueOnce(mockEpisodeQB as any);

      const result = await service.getWatchProgressByUser('user-1', { page: 1, limit: 10 });

      expect(result.data[0].contentTitle).toBe('Movie Title');
      expect(result.total).toBe(1);
    });

    it('should filter by isCompleted', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest
        .spyOn(watchProgressRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getWatchProgressByUser('user-1', { isCompleted: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('wp.isCompleted = :isCompleted', {
        isCompleted: true,
      });
    });
  });

  describe('getWatchHistory', () => {
    it('should return watch history', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockWatchProgress], 1]),
      };

      jest
        .spyOn(watchProgressRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getWatchHistory('user-1', { page: 1, limit: 10 });

      expect(result.data).toEqual([mockWatchProgress]);
      expect(result.total).toBe(1);
    });
  });

  describe('getRecentlyWatched', () => {
    it('should return recently watched', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockWatchProgress]),
      };

      jest
        .spyOn(watchProgressRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getRecentlyWatched('user-1', 10);

      expect(result).toEqual([mockWatchProgress]);
    });
  });

  describe('markAsCompleted', () => {
    it('should mark as completed', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(mockWatchProgress);
      jest
        .spyOn(watchProgressRepository, 'save')
        .mockResolvedValue({ ...mockWatchProgress, isCompleted: true });

      const result = await service.markAsCompleted('user-1', 'video-1');

      expect(result.isCompleted).toBe(true);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);

      await expect(service.markAsCompleted('user-1', 'video-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWatchProgress', () => {
    it('should delete watch progress', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(mockWatchProgress);
      jest.spyOn(watchProgressRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteWatchProgress('user-1', 'video-1');

      expect(result.message).toBe('Watch progress deleted successfully');
      expect(watchProgressRepository.delete).toHaveBeenCalledWith({
        user: { id: 'user-1' },
        video: { id: 'video-1' },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(watchProgressRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteWatchProgress('user-1', 'video-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
