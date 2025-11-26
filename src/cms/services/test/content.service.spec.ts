import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditLogService } from '../../../audit-log/service/audit-log.service';
import { ContentFilterDto, CreateContentDto, UpdateContentDto } from '../../dtos/content.dto';
import { ContentType, EntityContent } from '../../entities/content.entity';
import { EntityTVSeries } from '../../entities/tvseries.entity';
import { ActorService } from '../actor.service';
import { CategoryService } from '../category.service';
import { ContentService } from '../content.service';
import { DirectorService } from '../director.service';
import { MovieService } from '../movie.service';
import { TagService } from '../tag.service';
import { TvSeriesService } from '../tvseries.service';

describe('ContentService', () => {
  let service: ContentService;
  let contentRepository: Repository<EntityContent>;
  let tvSeriesRepository: Repository<EntityTVSeries>;
  let actorService: ActorService;
  let tagService: TagService;
  let categoryService: CategoryService;
  let directorService: DirectorService;
  let movieService: MovieService;
  let auditLogService: AuditLogService;

  const mockContent = {
    id: 'content-1',
    type: ContentType.MOVIE,
    title: 'Test Movie',
    description: 'Description',
    releaseDate: new Date(),
    thumbnail: 'thumb.jpg',
    banner: 'banner.jpg',
    trailer: 'trailer.mp4',
    imdbRating: 8.0,
    avgRating: 4.5,
    viewCount: 100,
    tags: [{ id: 'tag-1', name: 'Action' }],
    categories: [{ id: 'cat-1', categoryName: 'Action' }],
    actors: [{ id: 'actor-1', name: 'John Doe' }],
    directors: [{ id: 'director-1', name: 'Jane Doe' }],
  } as any;

  const mockMovie = {
    id: 'movie-1',
    content: mockContent,
  } as any;

  const mockTVSeries = {
    id: 'tv-1',
    metaData: mockContent,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: getRepositoryToken(EntityContent),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityTVSeries),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ActorService,
          useValue: {
            validateActors: jest.fn(),
          },
        },
        {
          provide: TagService,
          useValue: {
            validateTags: jest.fn(),
          },
        },
        {
          provide: CategoryService,
          useValue: {
            validateCategories: jest.fn(),
          },
        },
        {
          provide: DirectorService,
          useValue: {
            validateDirectors: jest.fn(),
          },
        },
        {
          provide: MovieService,
          useValue: {
            findByContentId: jest.fn(),
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

    service = module.get<ContentService>(ContentService);
    contentRepository = module.get<Repository<EntityContent>>(getRepositoryToken(EntityContent));
    tvSeriesRepository = module.get<Repository<EntityTVSeries>>(getRepositoryToken(EntityTVSeries));
    actorService = module.get<ActorService>(ActorService);
    tagService = module.get<TagService>(TagService);
    categoryService = module.get<CategoryService>(CategoryService);
    directorService = module.get<DirectorService>(DirectorService);
    movieService = module.get<MovieService>(MovieService);
    auditLogService = module.get<AuditLogService>(AuditLogService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateContentDto = {
      type: ContentType.MOVIE,
      title: 'New Movie',
      description: 'Desc',
      releaseDate: new Date(),
      thumbnail: 'thumb.jpg',
      banner: 'banner.jpg',
      trailer: 'trailer.mp4',
      maturityRating: 'PG13' as any,
      avgRating: 0,
      imdbRating: 0,
      actors: [{ id: 'actor-1' }] as any,
      tags: [{ id: 'tag-1' }] as any,
      categories: [{ id: 'cat-1' }] as any,
      directors: [{ id: 'director-1' }] as any,
    };

    it('should create content', async () => {
      jest.spyOn(actorService, 'validateActors').mockResolvedValue();
      jest.spyOn(tagService, 'validateTags').mockResolvedValue();
      jest.spyOn(categoryService, 'validateCategories').mockResolvedValue();
      jest.spyOn(directorService, 'validateDirectors').mockResolvedValue();
      jest.spyOn(contentRepository, 'create').mockReturnValue(mockContent);
      jest.spyOn(contentRepository, 'save').mockResolvedValue(mockContent);

      const result = await service.create(createDto);

      expect(result).toEqual(mockContent);
      expect(actorService.validateActors).toHaveBeenCalledWith(createDto.actors);
    });

    it('should throw BadRequestException on error', async () => {
      jest.spyOn(actorService, 'validateActors').mockResolvedValue();
      jest.spyOn(tagService, 'validateTags').mockResolvedValue();
      jest.spyOn(categoryService, 'validateCategories').mockResolvedValue();
      jest.spyOn(directorService, 'validateDirectors').mockResolvedValue();
      jest.spyOn(contentRepository, 'create').mockReturnValue(mockContent);
      jest.spyOn(contentRepository, 'save').mockRejectedValue(new Error('DB error'));

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateContentDto = {
      id: 'content-1',
      type: ContentType.MOVIE,
      title: 'Updated Title',
      description: 'Updated Desc',
      releaseDate: new Date(),
      thumbnail: 'thumb.jpg',
      banner: 'banner.jpg',
      trailer: 'trailer.mp4',
      maturityRating: 'PG13' as any,
      avgRating: 0,
      imdbRating: 0,
      viewCount: 0,
      actors: [{ id: 'actor-1' }] as any,
      tags: [{ id: 'tag-1' }] as any,
      categories: [{ id: 'cat-1' }] as any,
      directors: [{ id: 'director-1' }] as any,
    };

    it('should update content', async () => {
      jest.spyOn(service, 'findContentById').mockResolvedValue(mockContent);
      jest.spyOn(actorService, 'validateActors').mockResolvedValue();
      jest.spyOn(tagService, 'validateTags').mockResolvedValue();
      jest.spyOn(categoryService, 'validateCategories').mockResolvedValue();
      jest.spyOn(directorService, 'validateDirectors').mockResolvedValue();
      jest.spyOn(contentRepository, 'save').mockResolvedValue({ ...mockContent, ...updateDto });

      const result = await service.update('content-1', updateDto);

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(service, 'findContentById').mockRejectedValue(new NotFoundException());

      await expect(service.update('content-1', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete content', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockContent);
      jest.spyOn(contentRepository, 'remove').mockResolvedValue(mockContent);

      await service.delete('content-1');

      expect(contentRepository.remove).toHaveBeenCalledWith(mockContent);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(service.delete('content-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const filter: ContentFilterDto = { page: 1, limit: 10, type: ContentType.MOVIE };

    it('should return contents', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockContent], 1]),
      };

      jest.spyOn(contentRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filter);

      expect(result.items.movies).toEqual([mockContent]);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return content', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent);

      const result = await service.findOne('content-1');

      expect(result).toEqual(mockContent);
    });
  });

  describe('findContentById', () => {
    it('should return content', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent);

      const result = await service.findContentById('content-1');

      expect(result).toEqual(mockContent);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findContentById('content-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('increaseViewCount', () => {
    it('should increase view count and log', async () => {
      jest.spyOn(service, 'findContentById').mockResolvedValue(mockContent);
      jest.spyOn(contentRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(auditLogService, 'log').mockResolvedValue({} as any);

      await service.increaseViewCount('content-1');

      expect(contentRepository.update).toHaveBeenCalledWith({ id: 'content-1' }, { viewCount: 1 });
      expect(auditLogService.log).toHaveBeenCalledWith({
        action: LOG_ACTION.CONTENT_VIEW_INCREASED,
        userId: 'System',
        description: `View count increased for content: Updated Title (ID: content-1)`,
      });
    });
  });

  describe('getIdOfTVOrMovie', () => {
    it('should return movie id', async () => {
      jest.spyOn(service, 'findContentById').mockResolvedValue(mockContent);
      jest.spyOn(movieService, 'findByContentId').mockResolvedValue(mockMovie);

      const result = await service.getIdOfTVOrMovie('content-1');

      expect(result).toBe('movie-1');
    });

    it('should return tv series id', async () => {
      const tvContent = { ...mockContent, type: ContentType.TVSERIES };
      jest.spyOn(service, 'findContentById').mockResolvedValue(tvContent);
      jest.spyOn(tvSeriesRepository, 'findOne').mockResolvedValue(mockTVSeries);

      const result = await service.getIdOfTVOrMovie('content-1');

      expect(result).toBe('tv-1');
    });

    it('should throw BadRequestException for invalid type', async () => {
      const invalidContent = { ...mockContent, type: 'INVALID' };
      jest.spyOn(service, 'findContentById').mockResolvedValue(invalidContent);

      await expect(service.getIdOfTVOrMovie('content-1')).rejects.toThrow(BadRequestException);
    });
  });
});
