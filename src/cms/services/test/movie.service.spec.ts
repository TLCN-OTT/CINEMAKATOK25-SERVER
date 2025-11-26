import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateMovieDto, UpdateMovieDto } from '../../dtos/movies.dto';
import { EntityContent } from '../../entities/content.entity';
import { EntityMovie } from '../../entities/movie.entity';
import { VideoOwnerType } from '../../entities/video.entity';
import { MovieService } from '../movie.service';
import { VideoService } from '../video.service';

describe('MovieService', () => {
  let service: MovieService;
  let movieRepository: Repository<EntityMovie>;
  let contentRepository: Repository<EntityContent>;
  let videoService: VideoService;

  const mockContent = {
    id: 'content-1',
    title: 'Test Movie',
    description: 'Description',
    releaseDate: new Date(),
    thumbnail: 'thumb.jpg',
    banner: 'banner.jpg',
    trailer: 'trailer.mp4',
    imdbRating: 8.0,
    avgRating: 4.5,
    viewCount: 100,
  } as any;

  const mockMovie = {
    id: 'movie-1',
    duration: 120,
    metaData: mockContent,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        {
          provide: getRepositoryToken(EntityMovie),
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
          provide: getRepositoryToken(EntityContent),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: VideoService,
          useValue: {
            validateVideos: jest.fn(),
            assignVideos: jest.fn(),
            findByMovieIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
    movieRepository = module.get<Repository<EntityMovie>>(getRepositoryToken(EntityMovie));
    contentRepository = module.get<Repository<EntityContent>>(getRepositoryToken(EntityContent));
    videoService = module.get<VideoService>(VideoService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateMovieDto = {
      duration: 120,
      metaData: {
        type: 'MOVIE' as any,
        title: 'New Movie',
        description: 'Desc',
        releaseDate: new Date(),
        thumbnail: 'thumb.jpg',
        banner: 'banner.jpg',
        trailer: 'trailer.mp4',
        maturityRating: 'PG13' as any,
        avgRating: 0,
        imdbRating: 0,
        viewCount: 0,
        actors: [],
        directors: [],
        tags: [],
        categories: [],
      } as any,
      video: { id: 'video-1' } as any,
    };

    it('should create movie', async () => {
      jest.spyOn(contentRepository, 'create').mockReturnValue(mockContent);
      jest.spyOn(movieRepository, 'create').mockReturnValue(mockMovie);
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([{ id: 'video-1' }] as any);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockMovie);

      const result = await service.create(createDto);

      expect(result).toEqual(mockMovie);
      expect(videoService.assignVideos).toHaveBeenCalledWith(
        [{ id: 'video-1' }],
        mockMovie.id,
        VideoOwnerType.MOVIE,
      );
    });

    it('should throw BadRequestException if video invalid', async () => {
      jest.spyOn(contentRepository, 'create').mockReturnValue(mockContent);
      jest.spyOn(movieRepository, 'create').mockReturnValue(mockMovie);
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([]);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return movies', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockMovie], 1]),
      };

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(videoService, 'findByMovieIds').mockResolvedValue([]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockMovie]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return movie', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockMovie),
      };

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(videoService, 'findByMovieIds').mockResolvedValue([]);

      const result = await service.findOne('movie-1');

      expect(result).toEqual(mockMovie);
    });

    it('should throw NotFoundException if not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(movieRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await expect(service.findOne('movie-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByContentId', () => {
    it('should return movie by content id', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie);

      const result = await service.findByContentId('content-1');

      expect(result).toEqual(mockMovie);
    });
  });
});
