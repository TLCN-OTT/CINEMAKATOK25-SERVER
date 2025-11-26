import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditLogService } from '../../../audit-log/service/audit-log.service';
import { ContentType } from '../../../cms/entities/content.entity';
import { EntityMovie } from '../../../cms/entities/movie.entity';
import { EntityTVSeries } from '../../../cms/entities/tvseries.entity';
import { ContentService } from '../../../cms/services/content.service';
import { EntityFavorite } from '../../entities/favorite.entity';
import { FavoriteService } from '../favorite.service';

describe('FavoriteService', () => {
  let service: FavoriteService;
  let favoriteRepository: Repository<EntityFavorite>;
  let contentService: ContentService;
  let auditLogService: AuditLogService;

  const mockMovieContent = {
    id: 'content-1',
    title: 'Test Movie',
    type: ContentType.MOVIE,
    releaseDate: new Date('2024-01-01'),
    thumbnail: 'thumbnail.jpg',
    banner: 'banner.jpg',
    trailer: 'trailer.mp4',
  };

  const mockTVContent = {
    id: 'content-2',
    title: 'Test TV Series',
    type: ContentType.TVSERIES,
    releaseDate: new Date('2024-01-01'),
    thumbnail: 'thumbnail.jpg',
    banner: 'banner.jpg',
    trailer: 'trailer.mp4',
  };

  const mockFavorite = {
    id: 'favorite-1',
    user: { id: 'user-1' },
    content: mockMovieContent,
    createdAt: new Date(),
  };

  const mockMovie = {
    id: 'movie-1',
    duration: 120,
  };

  const mockTVSeries = {
    id: 'tv-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        {
          provide: getRepositoryToken(EntityFavorite),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            manager: {
              getRepository: jest.fn(),
            },
          },
        },
        {
          provide: ContentService,
          useValue: {
            findContentById: jest.fn(),
            getIdOfTVOrMovie: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
    favoriteRepository = module.get<Repository<EntityFavorite>>(getRepositoryToken(EntityFavorite));
    contentService = module.get<ContentService>(ContentService);
    auditLogService = module.get<AuditLogService>(AuditLogService);

    jest.clearAllMocks();
  });

  describe('createFavorite', () => {
    const createDto = {
      contentId: 'content-1',
    };

    it('should create a favorite for a movie successfully', async () => {
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockMovieContent as any);
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(favoriteRepository, 'create').mockReturnValue(mockFavorite as any);
      jest.spyOn(favoriteRepository, 'save').mockResolvedValue(mockFavorite as any);
      jest.spyOn(favoriteRepository, 'count').mockResolvedValue(1);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      const result = await service.createFavorite(createDto, 'user-1');

      expect(result).toEqual({
        totalFavorites: 1,
        isFavorited: false,
      });
      expect(favoriteRepository.create).toHaveBeenCalledWith({
        user: { id: 'user-1' },
        content: mockMovieContent,
      });
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.LIKE_MOVIE,
        userId: 'user-1',
        description: 'User user-1 liked movie with ID movie-1',
      });
    });

    it('should create a favorite for a TV series successfully', async () => {
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockTVContent as any);
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(favoriteRepository, 'create').mockReturnValue(mockFavorite as any);
      jest.spyOn(favoriteRepository, 'save').mockResolvedValue(mockFavorite as any);
      jest.spyOn(favoriteRepository, 'count').mockResolvedValue(1);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('tv-1');

      const result = await service.createFavorite({ contentId: 'content-2' }, 'user-1');

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.LIKE_SERIES,
        userId: 'user-1',
        description: 'User user-1 liked TV series with ID tv-1',
      });
    });

    it('should throw BadRequestException if content already favorited', async () => {
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockMovieContent as any);
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(mockFavorite as any);

      await expect(service.createFavorite(createDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(favoriteRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getFavoriteStatus', () => {
    it('should return favorite status with user', async () => {
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockMovieContent as any);
      jest.spyOn(favoriteRepository, 'count').mockResolvedValue(5);
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(mockFavorite as any);

      const result = await service.getFavoriteStatus('content-1', 'user-1');

      expect(result).toEqual({
        totalFavorites: 5,
        isFavorited: true,
      });
    });

    it('should return favorite status without user', async () => {
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockMovieContent as any);
      jest.spyOn(favoriteRepository, 'count').mockResolvedValue(5);

      const result = await service.getFavoriteStatus('content-1');

      expect(result).toEqual({
        totalFavorites: 5,
        isFavorited: false,
      });
      expect(favoriteRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if content not found', async () => {
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(null as any);

      await expect(service.getFavoriteStatus('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFavorite', () => {
    it('should remove a movie favorite successfully', async () => {
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockMovieContent as any);
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(mockFavorite as any);
      jest.spyOn(favoriteRepository, 'remove').mockResolvedValue(mockFavorite as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      const result = await service.removeFavorite('content-1', 'user-1');

      expect(result).toEqual({ message: 'Content removed from favorites successfully' });
      expect(favoriteRepository.remove).toHaveBeenCalledWith(mockFavorite);
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UNLIKE_MOVIE,
        userId: 'user-1',
        description: 'User user-1 unliked movie with ID movie-1',
      });
    });

    it('should remove a TV series favorite successfully', async () => {
      const tvFavorite = { ...mockFavorite, content: mockTVContent };
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockTVContent as any);
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(tvFavorite as any);
      jest.spyOn(favoriteRepository, 'remove').mockResolvedValue(tvFavorite as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('tv-1');

      const result = await service.removeFavorite('content-2', 'user-1');

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UNLIKE_SERIES,
        userId: 'user-1',
        description: 'User user-1 unliked TV series with ID tv-1',
      });
    });

    it('should throw NotFoundException if favorite not found', async () => {
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockMovieContent as any);
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeFavorite('content-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeArrayFavorite', () => {
    it('should remove multiple favorites successfully', async () => {
      const contentIds = ['content-1', 'content-2'];
      const favorites = [
        { ...mockFavorite, content: mockMovieContent },
        { ...mockFavorite, content: mockTVContent },
      ];

      jest
        .spyOn(favoriteRepository, 'findOne')
        .mockResolvedValueOnce(favorites[0] as any)
        .mockResolvedValueOnce(favorites[1] as any);
      jest
        .spyOn(contentService, 'findContentById')
        .mockResolvedValueOnce(mockMovieContent as any)
        .mockResolvedValueOnce(mockTVContent as any);
      jest.spyOn(favoriteRepository, 'remove').mockResolvedValue(mockFavorite as any);
      jest
        .spyOn(contentService, 'getIdOfTVOrMovie')
        .mockResolvedValueOnce('movie-1')
        .mockResolvedValueOnce('tv-1');

      const result = await service.removeArrayFavorite(contentIds, 'user-1');

      expect(result).toEqual({ message: 'Contents removed from favorites successfully' });
      expect(favoriteRepository.remove).toHaveBeenCalledTimes(2);
      expect(auditLogService.log).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if any favorite not found', async () => {
      const contentIds = ['content-1', 'content-2'];

      jest
        .spyOn(favoriteRepository, 'findOne')
        .mockResolvedValueOnce(mockFavorite as any)
        .mockResolvedValueOnce(null);
      jest.spyOn(contentService, 'findContentById').mockResolvedValue(mockMovieContent as any);
      jest.spyOn(favoriteRepository, 'remove').mockResolvedValue(mockFavorite as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      await expect(service.removeArrayFavorite(contentIds, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserFavorites', () => {
    it('should return user favorites with movie data', async () => {
      const favorites = [
        {
          id: 'fav-1',
          content: mockMovieContent,
          user: { id: 'user-1' },
        },
      ];

      const mockMovieQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockMovie),
      };

      jest.spyOn(favoriteRepository, 'find').mockResolvedValue(favorites as any);
      jest.spyOn(favoriteRepository.manager, 'getRepository').mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(mockMovieQueryBuilder),
      } as any);

      const result = await service.getUserFavorites('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'content-1',
        movieId: 'movie-1',
        tvSeriesId: null,
        title: 'Test Movie',
        type: ContentType.MOVIE,
        releaseDate: mockMovieContent.releaseDate,
        thumbnail: 'thumbnail.jpg',
        banner: 'banner.jpg',
        trailer: 'trailer.mp4',
        duration: 120,
      });
    });

    it('should return user favorites with TV series data', async () => {
      const favorites = [
        {
          id: 'fav-2',
          content: mockTVContent,
          user: { id: 'user-1' },
        },
      ];

      const mockTVQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockTVSeries),
      };

      jest.spyOn(favoriteRepository, 'find').mockResolvedValue(favorites as any);
      jest.spyOn(favoriteRepository.manager, 'getRepository').mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(mockTVQueryBuilder),
      } as any);

      const result = await service.getUserFavorites('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'content-2',
        movieId: null,
        tvSeriesId: 'tv-1',
        title: 'Test TV Series',
        type: ContentType.TVSERIES,
        releaseDate: mockTVContent.releaseDate,
        thumbnail: 'thumbnail.jpg',
        banner: 'banner.jpg',
        trailer: 'trailer.mp4',
        duration: null,
      });
    });

    it('should return empty array if user has no favorites', async () => {
      jest.spyOn(favoriteRepository, 'find').mockResolvedValue([]);

      const result = await service.getUserFavorites('user-1');

      expect(result).toEqual([]);
    });

    it('should handle mixed content types', async () => {
      const favorites = [
        { id: 'fav-1', content: mockMovieContent, user: { id: 'user-1' } },
        { id: 'fav-2', content: mockTVContent, user: { id: 'user-1' } },
      ];

      const mockMovieQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockMovie),
      };

      const mockTVQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockTVSeries),
      };

      jest.spyOn(favoriteRepository, 'find').mockResolvedValue(favorites as any);
      jest
        .spyOn(favoriteRepository.manager, 'getRepository')
        .mockReturnValueOnce({
          createQueryBuilder: jest.fn().mockReturnValue(mockMovieQueryBuilder),
        } as any)
        .mockReturnValueOnce({
          createQueryBuilder: jest.fn().mockReturnValue(mockTVQueryBuilder),
        } as any);

      const result = await service.getUserFavorites('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].movieId).toBe('movie-1');
      expect(result[1].tvSeriesId).toBe('tv-1');
    });
  });

  describe('logFavoriteAction', () => {
    it('should log like movie action', async () => {
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      await service['logFavoriteAction']('user-1', mockMovieContent, LOG_ACTION.LIKE_MOVIE);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.LIKE_MOVIE,
        userId: 'user-1',
        description: 'User user-1 liked movie with ID movie-1',
      });
    });

    it('should log unlike movie action', async () => {
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      await service['logFavoriteAction']('user-1', mockMovieContent, LOG_ACTION.UNLIKE_MOVIE);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UNLIKE_MOVIE,
        userId: 'user-1',
        description: 'User user-1 unliked movie with ID movie-1',
      });
    });

    it('should log like series action', async () => {
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('tv-1');

      await service['logFavoriteAction']('user-1', mockTVContent, LOG_ACTION.LIKE_SERIES);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.LIKE_SERIES,
        userId: 'user-1',
        description: 'User user-1 liked TV series with ID tv-1',
      });
    });

    it('should log unlike series action', async () => {
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('tv-1');

      await service['logFavoriteAction']('user-1', mockTVContent, LOG_ACTION.UNLIKE_SERIES);

      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.UNLIKE_SERIES,
        userId: 'user-1',
        description: 'User user-1 unliked TV series with ID tv-1',
      });
    });
  });
});
