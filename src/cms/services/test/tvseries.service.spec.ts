import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { VIDEO_STATUS } from '@app/common/enums/global.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateTVSeriesDto, UpdateTVSeriesDto } from '../../dtos/tvseries.dto';
import { EntityEpisode, EntitySeason, EntityTVSeries } from '../../entities/tvseries.entity';
import { VideoOwnerType } from '../../entities/video.entity';
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

  const mockContent = {
    id: 'content-1',
    title: 'Test TV Series',
    description: 'Description',
    releaseDate: new Date(),
    thumbnail: 'thumb.jpg',
    banner: 'banner.jpg',
    trailer: 'trailer.mp4',
    imdbRating: 8.0,
    avgRating: 4.5,
    viewCount: 100,
  } as any;

  const mockTVSeries = {
    id: 'tv-1',
    metaData: mockContent,
    seasons: [],
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TvSeriesService,
        {
          provide: getRepositoryToken(EntityTVSeries),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
            manager: {
              save: jest.fn(),
              connection: {
                createQueryRunner: jest.fn().mockReturnValue({
                  connect: jest.fn(),
                  startTransaction: jest.fn(),
                  commitTransaction: jest.fn(),
                  rollbackTransaction: jest.fn(),
                  release: jest.fn(),
                  manager: {
                    save: jest.fn(),
                  },
                }),
              },
            },
          },
        },
        {
          provide: getRepositoryToken(EntitySeason),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityEpisode),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ContentService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: VideoService,
          useValue: {
            validateVideos: jest.fn(),
            assignVideos: jest.fn(),
            findByTVSeriesIds: jest.fn(),
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

  describe('create', () => {
    const createDto: CreateTVSeriesDto = {
      metaData: {
        title: 'New TV Series',
        description: 'Desc',
        releaseDate: new Date(),
        thumbnail: 'thumb.jpg',
        banner: 'banner.jpg',
        trailer: 'trailer.mp4',
      } as any,
      seasons: [
        {
          seasonNumber: 1,
          episodes: [
            {
              episodeNumber: 1,
              episodeTitle: 'Episode 1',
              episodeDuration: 45,
              video: { id: 'video-1', status: VIDEO_STATUS.PROCESSING } as any,
            },
          ],
        },
      ],
    };

    it('should create TV series', async () => {
      jest.spyOn(contentService, 'create').mockResolvedValue(mockContent);
      jest.spyOn(tvSeriesRepository, 'create').mockReturnValue(mockTVSeries);
      jest.spyOn(seasonRepository, 'create').mockReturnValue({ id: 'season-1' } as any);
      jest.spyOn(episodeRepository, 'create').mockReturnValue({ id: 'episode-1' } as any);
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([{ id: 'video-1' } as any]);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTVSeries);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTVSeries);
    });
  });

  describe('findAll', () => {
    it('should return TV series', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTVSeries], 1]),
      };

      jest.spyOn(tvSeriesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockTVSeries]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return TV series', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockTVSeries),
      };

      jest.spyOn(tvSeriesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findOne('tv-1');

      expect(result).toEqual(mockTVSeries);
    });

    it('should throw NotFoundException if not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(tvSeriesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await expect(service.findOne('tv-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByContentId', () => {
    it('should return TV series by content id', async () => {
      jest.spyOn(tvSeriesRepository, 'findOne').mockResolvedValue(mockTVSeries);

      const result = await service.findByContentId('content-1');

      expect(result).toEqual(mockTVSeries);
    });
  });
});
