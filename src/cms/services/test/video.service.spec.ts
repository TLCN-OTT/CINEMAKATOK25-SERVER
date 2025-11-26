import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { VIDEO_STATUS } from '@app/common/enums/global.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateVideoDto, UpdateVideoDto } from '../../dtos/video.dto';
import { EntityEpisode } from '../../entities/tvseries.entity';
import { EntityVideo, VideoOwnerType } from '../../entities/video.entity';
import { VideoService } from '../video.service';

describe('VideoService', () => {
  let service: VideoService;
  let videoRepository: Repository<EntityVideo>;
  let episodeRepository: Repository<EntityEpisode>;

  const mockVideo = {
    id: 'video-1',
    videoUrl: 'video.mp4',
    thumbnailUrl: 'thumb.jpg',
    ownerType: VideoOwnerType.MOVIE,
    ownerId: 'movie-1',
    status: 'active',
    createdAt: new Date(),
  } as any;

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
            delete: jest.fn(),
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

    service = module.get<VideoService>(VideoService);
    videoRepository = module.get<Repository<EntityVideo>>(getRepositoryToken(EntityVideo));
    episodeRepository = module.get<Repository<EntityEpisode>>(getRepositoryToken(EntityEpisode));

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateVideoDto = {
      videoUrl: 'new-video.mp4',
      status: VIDEO_STATUS.PROCESSING,
    };

    it('should create video', async () => {
      jest.spyOn(videoRepository, 'create').mockReturnValue(mockVideo);
      jest.spyOn(videoRepository, 'save').mockResolvedValue(mockVideo);

      const result = await service.create(createDto);

      expect(result).toEqual(mockVideo);
    });

    it('should throw BadRequestException on error', async () => {
      jest.spyOn(videoRepository, 'create').mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return videos', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockVideo], 1]),
      };

      jest.spyOn(videoRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockVideo]);
      expect(result.total).toBe(1);
    });

    it('should search videos', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockVideo], 1]),
      };

      jest.spyOn(videoRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll({ search: 'video.mp4' });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        `similarity(video.videoUrl, :search) > 0.2`,
      );
    });
  });

  describe('findOne', () => {
    it('should return video', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue(mockVideo);

      const result = await service.findOne('video-1');

      expect(result).toEqual(mockVideo);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('video-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateVideos', () => {
    it('should validate videos', async () => {
      jest.spyOn(videoRepository, 'find').mockResolvedValue([]);

      const result = await service.validateVideos([{ id: 'video-1', videoUrl: 'test.mp4' }] as any);

      expect(result).toEqual([]);
    });

    it('should return empty if no videos', async () => {
      jest.spyOn(videoRepository, 'find').mockResolvedValue([]);

      const result = await service.validateVideos([]);

      expect(result).toEqual([]);
    });
  });

  describe('assignVideos', () => {
    it('should assign videos', async () => {
      jest.spyOn(videoRepository, 'update').mockResolvedValue({} as any);

      await service.assignVideos([mockVideo], 'movie-1', VideoOwnerType.MOVIE);

      expect(videoRepository.update).toHaveBeenCalledWith('video-1', {
        ownerType: VideoOwnerType.MOVIE,
        ownerId: 'movie-1',
      });
    });
  });

  describe('findByMovieIds', () => {
    it('should return videos by movie ids', async () => {
      jest.spyOn(videoRepository, 'find').mockResolvedValue([mockVideo]);

      const result = await service.findByMovieIds(['movie-1']);

      expect(result).toEqual([mockVideo]);
    });
  });
});
