import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditLogService } from '../../../audit-log/service/audit-log.service';
import { ContentType, EntityContent } from '../../../cms/entities/content.entity';
import { ContentService } from '../../../cms/services/content.service';
import { EntityWatchList } from '../../entities/watchlist.entity';
import { WatchListService } from '../watchlist.service';

describe('WatchListService', () => {
  let service: WatchListService;
  let watchListRepository: Repository<EntityWatchList>;
  let contentRepository: Repository<EntityContent>;
  let auditLogService: AuditLogService;
  let contentService: ContentService;

  const mockContent = {
    id: 'content-1',
    title: 'Test Movie',
    type: ContentType.MOVIE,
    description: 'Description',
    thumbnail: 'thumb.jpg',
    releaseDate: new Date(),
    trailer: 'trailer.mp4',
    maturityRating: 'PG',
    categories: [{ categoryName: 'Action' }],
  };

  const mockWatchListItem = {
    id: 'watchlist-1',
    user: { id: 'user-1' },
    content: mockContent,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchListService,
        {
          provide: getRepositoryToken(EntityWatchList),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
            manager: {
              createQueryBuilder: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(EntityContent),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: ContentService,
          useValue: {
            getIdOfTVOrMovie: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WatchListService>(WatchListService);
    watchListRepository = module.get<Repository<EntityWatchList>>(
      getRepositoryToken(EntityWatchList),
    );
    contentRepository = module.get<Repository<EntityContent>>(getRepositoryToken(EntityContent));
    auditLogService = module.get<AuditLogService>(AuditLogService);
    contentService = module.get<ContentService>(ContentService);

    jest.clearAllMocks();
  });

  describe('addToWatchList', () => {
    it('should add content to watchlist successfully', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent as any);
      jest.spyOn(watchListRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(watchListRepository, 'create').mockReturnValue(mockWatchListItem as any);
      jest.spyOn(watchListRepository, 'save').mockResolvedValue(mockWatchListItem as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      const result = await service.addToWatchList('user-1', 'content-1');

      expect(result).toEqual(mockWatchListItem);
      expect(contentRepository.findOne).toHaveBeenCalledWith({ where: { id: 'content-1' } });
      expect(watchListRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' }, content: { id: 'content-1' } },
      });
      expect(watchListRepository.save).toHaveBeenCalledWith(mockWatchListItem);
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.ADD_MOVIE_TO_WATCHLIST,
        userId: 'user-1',
        description: 'User user-1 added movie with ID movie-1',
      });
    });

    it('should throw NotFoundException if content not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addToWatchList('user-1', 'content-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(contentRepository.findOne).toHaveBeenCalledWith({ where: { id: 'content-1' } });
    });

    it('should throw ConflictException if already in watchlist', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent as any);
      jest.spyOn(watchListRepository, 'findOne').mockResolvedValue(mockWatchListItem as any);

      await expect(service.addToWatchList('user-1', 'content-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeFromWatchList', () => {
    it('should remove content from watchlist successfully', async () => {
      jest.spyOn(watchListRepository, 'findOne').mockResolvedValue(mockWatchListItem as any);
      jest.spyOn(watchListRepository, 'remove').mockResolvedValue(mockWatchListItem as any);
      jest.spyOn(contentService, 'getIdOfTVOrMovie').mockResolvedValue('movie-1');

      await service.removeFromWatchList('user-1', 'content-1');

      expect(watchListRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' }, content: { id: 'content-1' } },
        relations: ['content'],
      });
      expect(watchListRepository.remove).toHaveBeenCalledWith(mockWatchListItem);
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.REMOVE_MOVIE_FROM_WATCHLIST,
        userId: 'user-1',
        description: 'User user-1 removed movie with ID movie-1',
      });
    });

    it('should throw NotFoundException if not in watchlist', async () => {
      jest.spyOn(watchListRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeFromWatchList('user-1', 'content-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserWatchList', () => {
    it('should return user watchlist with transformed data', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockWatchListItem], 1]),
      };
      const mockMovies = [{ movieId: 'movie-1', contentId: 'content-1', duration: 120 }];
      const mockTVSeries = [];
      const mockMovieQB = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockMovies),
      };
      const mockTVQB = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockTVSeries),
      };

      jest
        .spyOn(watchListRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);
      jest
        .spyOn(watchListRepository.manager, 'createQueryBuilder')
        .mockReturnValueOnce(mockMovieQB as any)
        .mockReturnValueOnce(mockTVQB as any);

      const result = await service.getUserWatchList('user-1', { page: 1, limit: 10 });

      expect(result).toEqual({
        data: [
          {
            id: 'watchlist-1',
            createdAt: mockWatchListItem.createdAt,
            updatedAt: mockWatchListItem.updatedAt,
            content: {
              id: 'movie-1',
              contentId: 'content-1',
              type: 'MOVIE',
              title: 'Test Movie',
              description: 'Description',
              thumbnail: 'thumb.jpg',
              releaseDate: mockContent.releaseDate,
              trailer: 'trailer.mp4',
              maturityRating: 'PG',
              categories: ['Action'],
              duration: 120,
            },
          },
        ],
        total: 1,
      });
    });

    it('should return empty list if no data', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest
        .spyOn(watchListRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getUserWatchList('user-1');

      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('isInWatchList', () => {
    it('should return true if in watchlist', async () => {
      jest.spyOn(watchListRepository, 'count').mockResolvedValue(1);

      const result = await service.isInWatchList('user-1', 'content-1');

      expect(result).toBe(true);
      expect(watchListRepository.count).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' }, content: { id: 'content-1' } },
      });
    });

    it('should return false if not in watchlist', async () => {
      jest.spyOn(watchListRepository, 'count').mockResolvedValue(0);

      const result = await service.isInWatchList('user-1', 'content-1');

      expect(result).toBe(false);
    });
  });

  describe('isInWatchListByMovieId', () => {
    it('should return true if movie is in watchlist', async () => {
      const mockQB = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ contentId: 'content-1' }),
      };
      jest.spyOn(watchListRepository.manager, 'createQueryBuilder').mockReturnValue(mockQB as any);
      jest.spyOn(service, 'isInWatchList').mockResolvedValue(true);

      const result = await service.isInWatchListByMovieId('user-1', 'movie-1', 'MOVIE');

      expect(result).toBe(true);
      expect(service.isInWatchList).toHaveBeenCalledWith('user-1', 'content-1');
    });

    it('should return false if movie not found', async () => {
      const mockQB = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      jest.spyOn(watchListRepository.manager, 'createQueryBuilder').mockReturnValue(mockQB as any);

      const result = await service.isInWatchListByMovieId('user-1', 'movie-1', 'MOVIE');

      expect(result).toBe(false);
    });
  });

  describe('getFavouriteCount', () => {
    it('should return the count of favourites', async () => {
      jest.spyOn(watchListRepository, 'count').mockResolvedValue(5);

      const result = await service.getFavouriteCount('content-1');

      expect(result).toBe(5);
      expect(watchListRepository.count).toHaveBeenCalledWith({
        where: { content: { id: 'content-1' } },
      });
    });
  });
});
