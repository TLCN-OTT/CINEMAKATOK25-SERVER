import { In, Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { VIDEO_STATUS } from '@app/common/enums/global.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EntityEpisode } from '../../entities/tvseries.entity';
import { EntityVideo, VideoOwnerType } from '../../entities/video.entity';
import { VideoService } from '../video.service';

describe('VideoService', () => {
  let service: VideoService;
  let videoRepository: Repository<EntityVideo>;
  let episodeRepository: Repository<EntityEpisode>;

  const mockVideo: EntityVideo = {
    id: 'video-1',
    videoUrl: 'video.mp4',
    thumbnailUrl: 'thumb.jpg',
    ownerType: VideoOwnerType.MOVIE,
    ownerId: 'movie-1',
    status: 'active',
    createdAt: new Date(),
  } as any;

  const mockEpisode = {
    id: 'ep-1',
    season: {
      tvseries: { id: 'series-99' },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: getRepositoryToken(EntityVideo),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityEpisode),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(VideoService);
    videoRepository = module.get(getRepositoryToken(EntityVideo));
    episodeRepository = module.get(getRepositoryToken(EntityEpisode));

    jest.clearAllMocks();
  });

  // -------------------------------------------------------
  describe('create', () => {
    it('should create video successfully', async () => {
      videoRepository.create = jest.fn().mockReturnValue(mockVideo);
      videoRepository.save = jest.fn().mockResolvedValue(mockVideo);

      const result = await service.create({
        videoUrl: 'test.mp4',
        status: VIDEO_STATUS.READY,
      });

      expect(result).toEqual(mockVideo);
    });

    it('should throw BadRequestException on error', async () => {
      videoRepository.create = jest.fn(() => {
        throw new Error('DB error');
      });

      await expect(service.create({ videoUrl: 'x', status: VIDEO_STATUS.READY })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // -------------------------------------------------------
  describe('findAll', () => {
    const mockQB = {
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockVideo], 1]),
    };

    beforeEach(() => {
      videoRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQB);
    });

    it('should return result without search/sort', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockVideo]);
      expect(result.total).toBe(1);
      expect(mockQB.orderBy).toHaveBeenCalled();
    });

    it('should apply search', async () => {
      await service.findAll({ search: 'video.mp4' });

      expect(mockQB.where).toHaveBeenCalledWith('similarity(video.videoUrl, :search) > 0.2');
      expect(mockQB.addSelect).toHaveBeenCalled();
    });

    it('should apply sort', async () => {
      await service.findAll({
        sort: JSON.stringify({ videoUrl: 'ASC' }),
      });

      expect(mockQB.addOrderBy).toHaveBeenCalledWith('video.videoUrl', 'ASC');
    });
  });

  // -------------------------------------------------------
  describe('findOne', () => {
    it('should return video', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue(mockVideo);

      const result = await service.findOne('video-1');

      expect(result).toEqual(mockVideo);
    });

    it('should throw NotFoundException', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne('video-1')).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------
  describe('update', () => {
    it('should update video', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue(mockVideo);
      videoRepository.save = jest.fn().mockResolvedValue(mockVideo);

      const result = await service.update('video-1', {
        videoUrl: 'new.mp4',
        id: 'video-1',
      });

      expect(result).toEqual(mockVideo);
      expect(videoRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if video missing', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update('video-1', { videoUrl: 'new.mp4', id: 'video-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on save error', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue(mockVideo);
      videoRepository.save = jest.fn(() => {
        throw new Error('save error');
      });

      await expect(
        service.update('video-1', { videoUrl: 'new.mp4', id: 'video-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------
  describe('delete', () => {
    it('should delete video', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue(mockVideo);
      videoRepository.remove = jest.fn().mockResolvedValue({});

      await service.delete('video-1');

      expect(videoRepository.remove).toHaveBeenCalledWith(mockVideo);
    });

    it('should throw NotFoundException if not exist', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue(null);
      await expect(service.delete('x')).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------
  describe('findByEpisodeIds', () => {
    it('should return empty if no ids', async () => {
      const result = await service.findByEpisodeIds([]);

      expect(result).toEqual([]);
    });

    it('should return videos', async () => {
      videoRepository.find = jest.fn().mockResolvedValue([mockVideo]);

      const result = await service.findByEpisodeIds(['ep1']);

      expect(result).toEqual([mockVideo]);
    });
  });

  // -------------------------------------------------------
  describe('findByMovie', () => {
    it('should return videos', async () => {
      videoRepository.find = jest.fn().mockResolvedValue([mockVideo]);

      const result = await service.findByMovie('movie-1');

      expect(result).toEqual([mockVideo]);
    });
  });

  // -------------------------------------------------------
  describe('validateVideos', () => {
    it('should return videos by ids', async () => {
      videoRepository.find = jest.fn().mockResolvedValue([mockVideo]);

      const result = await service.validateVideos([{ id: 'video-1', videoUrl: '' }]);

      expect(result).toEqual([mockVideo]);
    });
  });

  // -------------------------------------------------------
  describe('assignVideos', () => {
    it('should assign videos', async () => {
      videoRepository.update = jest.fn().mockResolvedValue({});

      await service.assignVideos([mockVideo], 'movie-1', VideoOwnerType.MOVIE);

      expect(videoRepository.update).toHaveBeenCalledWith('video-1', {
        ownerType: VideoOwnerType.MOVIE,
        ownerId: 'movie-1',
      });
    });
  });

  // -------------------------------------------------------
  describe('unassignVideosByEpisodeIds', () => {
    it('should skip if empty', async () => {
      await service.unassignVideosByEpisodeIds([]);
      expect(videoRepository.update).not.toHaveBeenCalled();
    });

    it('should update videos', async () => {
      videoRepository.update = jest.fn().mockResolvedValue({});

      await service.unassignVideosByEpisodeIds(['ep1']);

      expect(videoRepository.update).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  describe('findByMovieIds', () => {
    it('should return empty if no ids', async () => {
      const result = await service.findByMovieIds([]);

      expect(result).toEqual([]);
    });

    it('should return videos', async () => {
      videoRepository.find = jest.fn().mockResolvedValue([mockVideo]);

      const result = await service.findByMovieIds(['m1']);

      expect(result).toEqual([mockVideo]);
    });
  });

  // -------------------------------------------------------
  describe('unassignVideosByMovieIds', () => {
    it('should skip if empty', async () => {
      await service.unassignVideosByMovieIds([]);
      expect(videoRepository.update).not.toHaveBeenCalled();
    });

    it('should update correctly', async () => {
      videoRepository.update = jest.fn().mockResolvedValue({});

      await service.unassignVideosByMovieIds(['m1']);

      expect(videoRepository.update).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  describe('findByOwner', () => {
    it('should find video by owner', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue(mockVideo);

      const result = await service.findByOwner('movie-1', VideoOwnerType.MOVIE);

      expect(result).toEqual(mockVideo);
    });
  });

  // -------------------------------------------------------
  describe('getMovieOrSeriesIdFromVideo', () => {
    it('should return movieId for movie video', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue(mockVideo);

      const result = await service.getMovieOrSeriesIdFromVideo('video-1');

      expect(result).toEqual({ movieId: 'movie-1' });
    });

    it('should return tvSeriesId for episode video', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue({
        id: 'v2',
        ownerType: 'episode',
        ownerId: 'ep-1',
      });

      episodeRepository.findOne = jest.fn().mockResolvedValue(mockEpisode);

      const result = await service.getMovieOrSeriesIdFromVideo('v2');

      expect(result).toEqual({ tvSeriesId: 'series-99' });
    });

    it('should throw if ownerId null', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue({
        id: 'v3',
        ownerType: 'episode',
        ownerId: null,
      });

      await expect(service.getMovieOrSeriesIdFromVideo('v3')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFound if video missing', async () => {
      videoRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getMovieOrSeriesIdFromVideo('none')).rejects.toThrow(NotFoundException);
    });
  });
});
