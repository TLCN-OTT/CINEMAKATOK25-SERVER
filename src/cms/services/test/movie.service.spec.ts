import { Repository, SelectQueryBuilder } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateMovieDto, UpdateMovieDto } from '../../dtos/movies.dto';
import { EntityContent } from '../../entities/content.entity';
import { EntityMovie } from '../../entities/movie.entity';
import { EntityVideo, VideoOwnerType } from '../../entities/video.entity';
import { MovieService } from '../movie.service';
import { VideoService } from '../video.service';

describe('MovieService', () => {
  let service: MovieService;
  let movieRepository: Repository<EntityMovie>;
  let contentRepository: Repository<EntityContent>;
  let videoService: VideoService;

  // --- Mock Data ---
  const mockContent = {
    id: 'content-1',
    title: 'Test Movie',
    description: 'Description',
    releaseDate: new Date(),
    viewCount: 100,
    categories: [{ id: 'cat-1' }],
    actors: [{ id: 'actor-1' }],
    directors: [{ id: 'dir-1' }],
  } as any;

  const mockMovie = {
    id: 'movie-1',
    duration: 120,
    metaData: mockContent,
    createdAt: new Date(),
  } as any;

  const mockVideo = {
    id: 'video-1',
    ownerId: 'movie-1',
    status: 'READY',
  } as EntityVideo;

  // --- Mocks ---
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findOne: jest.fn(),
    },
  };

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
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            manager: {
              connection: {
                createQueryRunner: jest.fn(() => mockQueryRunner),
              },
            },
          },
        },
        {
          provide: getRepositoryToken(EntityContent),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            target: 'EntityContent', // needed for update logic
          },
        },
        {
          provide: VideoService,
          useValue: {
            validateVideos: jest.fn(),
            assignVideos: jest.fn(),
            findByMovieIds: jest.fn(),
            unassignVideosByMovieIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
    movieRepository = module.get<Repository<EntityMovie>>(getRepositoryToken(EntityMovie));
    contentRepository = module.get<Repository<EntityContent>>(getRepositoryToken(EntityContent));
    videoService = module.get<VideoService>(VideoService);

    jest.clearAllMocks();

    // Default QueryBuilder behaviors
    mockQueryBuilder.getOne.mockResolvedValue(mockMovie);
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockMovie], 1]);

    // --- FIX: Default Mock cho videoService để tránh lỗi undefined.find ---
    jest.spyOn(videoService, 'findByMovieIds').mockResolvedValue([]);
  });

  describe('create', () => {
    const createDto: CreateMovieDto = {
      duration: 120,
      metaData: { title: 'New Movie' } as any,
      video: { id: 'video-1' } as any,
    };

    it('should create movie successfully with video', async () => {
      // Setup
      jest.spyOn(contentRepository, 'create').mockReturnValue(mockContent);
      jest.spyOn(movieRepository, 'create').mockReturnValue(mockMovie);
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([mockVideo]);
      // Mock findOne for the return statement
      jest.spyOn(service, 'findOne').mockResolvedValue(mockMovie);

      // Execute
      const result = await service.create(createDto);

      // Verify
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(mockContent);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(mockMovie);
      expect(videoService.validateVideos).toHaveBeenCalledWith([createDto.video]);
      expect(videoService.assignVideos).toHaveBeenCalledWith(
        [mockVideo],
        mockMovie.id,
        VideoOwnerType.MOVIE,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockMovie);
    });

    it('should throw BadRequestException if video is invalid', async () => {
      jest.spyOn(contentRepository, 'create').mockReturnValue(mockContent);
      jest.spyOn(movieRepository, 'create').mockReturnValue(mockMovie);
      // Validate returns empty array implies invalid
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([]);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on generic error', async () => {
      const error = new Error('DB Error');
      jest.spyOn(contentRepository, 'create').mockImplementation(() => {
        throw error;
      });

      await expect(service.create(createDto)).rejects.toThrow(error);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated movies with videos', async () => {
      jest.spyOn(videoService, 'findByMovieIds').mockResolvedValue([mockVideo]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(videoService.findByMovieIds).toHaveBeenCalledWith([mockMovie.id]);
      expect(result.data[0]['video']).toEqual(mockVideo);
      expect(result.total).toBe(1);
    });

    it('should handle search queries', async () => {
      const query = { search: JSON.stringify({ title: 'Test' }) };
      await service.findAll(query);

      // Check if search logic was triggered in QueryBuilder
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.setParameters).toHaveBeenCalled();
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('similarity'),
        'rank',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('rank', 'DESC');
    });

    it('should handle sort queries', async () => {
      const query = { sort: JSON.stringify({ viewCount: 'DESC', duration: 'ASC' }) };
      await service.findAll(query);

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('metaData.viewCount', 'DESC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('movie.duration', 'ASC');
    });
  });

  describe('findOne', () => {
    it('should return movie with video attached', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMovie);
      jest.spyOn(videoService, 'findByMovieIds').mockResolvedValue([mockVideo]);

      const result = await service.findOne('movie-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('movie.id = :id', { id: 'movie-1' });
      expect(result).toEqual(mockMovie);
      expect(result['video']).toEqual(mockVideo);
    });

    it('should throw NotFoundException if not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      await expect(service.findOne('movie-99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateMovieDto = {
      metaData: { title: 'Updated Title' } as any,
      duration: 150,
      video: { id: 'video-2' } as any,
    };

    beforeEach(() => {
      // Service.findOne relies on queryBuilder
      mockQueryBuilder.getOne.mockResolvedValue(mockMovie);
      // Service.findOne also attaches videos, so mock that
      jest.spyOn(videoService, 'findByMovieIds').mockResolvedValue([]);
    });

    it('should update metadata, movie data, and assign new video', async () => {
      const validVideo = { id: 'video-2' } as any;
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([validVideo]);

      const result = await service.update('movie-1', updateDto);

      // Verify Content Metadata Update
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        'EntityContent',
        expect.objectContaining({
          ...mockMovie.metaData,
          title: 'Updated Title',
        }),
      );

      // Verify Movie Update
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(undefined, 'movie-1', {
        duration: 150,
      });

      // Verify Video Handling
      expect(videoService.unassignVideosByMovieIds).toHaveBeenCalledWith(['movie-1']);
      expect(videoService.assignVideos).toHaveBeenCalledWith(
        [validVideo],
        'movie-1',
        VideoOwnerType.MOVIE,
      );

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should unassign video if video passed as null', async () => {
      // Video is explicit null
      await service.update('movie-1', { video: null } as any);

      expect(videoService.unassignVideosByMovieIds).toHaveBeenCalledWith(['movie-1']);
      expect(videoService.assignVideos).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if new video is invalid', async () => {
      jest.spyOn(videoService, 'validateVideos').mockResolvedValue([]); // Invalid

      await expect(service.update('movie-1', updateDto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback if findOne fails inside update', async () => {
      // First findOne succeeds (check existence), but let's simulate error during processing
      const error = new Error('Update failed');
      mockQueryRunner.manager.save.mockImplementation(() => {
        throw error;
      });

      await expect(service.update('movie-1', updateDto)).rejects.toThrow(error);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete movie and unassign videos', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(mockMovie);

      await service.delete('movie-1');

      expect(mockQueryRunner.manager.findOne).toHaveBeenCalled();
      expect(videoService.unassignVideosByMovieIds).toHaveBeenCalledWith(['movie-1']);
      expect(mockQueryRunner.manager.remove).toHaveBeenCalledWith(mockMovie);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.delete('movie-99')).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('getTrendingMovies', () => {
    it('should return trending movies sorted by hotness', async () => {
      await service.getTrendingMovies({ page: 1 });

      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('LOG(10'),
        'hotness',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('hotness', 'DESC');
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
    });
  });

  describe('getMoviesByCategory', () => {
    it('should filter movies by category', async () => {
      await service.getMoviesByCategory('cat-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('categories.id = :categoryId', {
        categoryId: 'cat-1',
      });
    });
  });

  describe('getRecommendationsByMovieId', () => {
    it('should return recommended movies based on similarity', async () => {
      // First call: get current movie
      mockQueryBuilder.getOne.mockResolvedValueOnce(mockMovie);
      // Second call: get recommendations
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([[mockMovie], 1]);

      await service.getRecommendationsByMovieId('movie-1');

      // Verify exclusion of current movie
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('movie.id != :movieId', {
        movieId: 'movie-1',
      });

      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        expect.any(String),
        'similarity_score',
      );

      // Verify parameters set from current movie
      expect(mockQueryBuilder.setParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          description: mockMovie.metaData.description,
          title: mockMovie.metaData.title,
        }),
      );
    });

    it('should throw NotFoundException if current movie not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.getRecommendationsByMovieId('movie-99')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByContentId', () => {
    it('should return movie by content id', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie);

      const result = await service.findByContentId('content-1');

      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { metaData: { id: 'content-1' } },
        relations: ['metaData'],
      });
      expect(result).toEqual(mockMovie);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findByContentId('content-99')).rejects.toThrow(NotFoundException);
    });
  });
});
