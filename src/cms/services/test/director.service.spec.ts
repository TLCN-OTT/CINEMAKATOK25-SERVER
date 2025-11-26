import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateDirectorDto, UpdateDirectorDto } from '../../dtos/director.dto';
import { EntityDirector } from '../../entities/actor.entity';
import { DirectorService } from '../director.service';

describe('DirectorService', () => {
  let service: DirectorService;
  let directorRepository: Repository<EntityDirector>;

  const mockContent = {
    id: 'content-1',
    title: 'Test Movie',
    type: 'MOVIE',
    releaseDate: new Date(),
  } as any;

  const mockDirector = {
    id: 'director-1',
    name: 'John Doe',
    nationality: 'American',
    contents: [mockContent],
    createdAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(EntityDirector),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
            manager: {
              createQueryBuilder: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<EntityDirector>>(getRepositoryToken(EntityDirector));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create director', async () => {
      const createDto: CreateDirectorDto = {
        name: 'Jane Doe',
        nationality: 'British',
        dateOfBirth: new Date('1980-01-01'),
        gender: 'FEMALE' as any,
        bio: 'Test bio',
        profilePicture: 'test.jpg',
      };
      jest.spyOn(directorRepository, 'create').mockReturnValue(mockDirector);
      jest.spyOn(directorRepository, 'save').mockResolvedValue(mockDirector);

      const result = await service.create(createDto);

      expect(result).toEqual(mockDirector);
      expect(directorRepository.create).toHaveBeenCalledWith(createDto);
      expect(directorRepository.save).toHaveBeenCalledWith(mockDirector);
    });
  });

  describe('findAll', () => {
    it('should return directors', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockDirector], 1]),
      };

      jest.spyOn(directorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockDirector]);
      expect(result.total).toBe(1);
    });

    it('should search directors', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockDirector], 1]),
      };

      jest.spyOn(directorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll({ search: 'John' });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        `similarity(director.name, :search) > 0.2`,
      );
    });
  });

  describe('findOne', () => {
    it('should return director with enrichment', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockDirector),
      };
      const mockMovieQB = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ movieId: 'movie-1', contentId: 'content-1', duration: 120 }]),
      };
      const mockTVQB = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(directorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest
        .spyOn(directorRepository.manager, 'createQueryBuilder')
        .mockReturnValueOnce(mockMovieQB as any)
        .mockReturnValueOnce(mockTVQB as any);

      const result = await service.findOne('director-1');

      expect(result.contents[0].movieOrSeriesId).toBe('movie-1');
      expect(result.contents[0].duration).toBe(120);
    });

    it('should throw NotFoundException if not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(directorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await expect(service.findOne('director-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return director', async () => {
      jest.spyOn(directorRepository, 'findOne').mockResolvedValue(mockDirector);

      const result = await service.findById('director-1');

      expect(result).toEqual(mockDirector);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(directorRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('director-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateDirectorDto = {
      id: 'director-1',
      name: 'Updated Name',
      dateOfBirth: new Date('1980-01-01'),
      gender: 'FEMALE' as any,
      bio: 'Updated bio',
      profilePicture: 'updated.jpg',
      nationality: 'British',
    };

    it('should update director', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDirector);
      jest.spyOn(directorRepository, 'save').mockResolvedValue({ ...mockDirector, ...updateDto });

      const result = await service.update('director-1', updateDto);

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should remove director', async () => {
      const mockDeleteQB = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      jest.spyOn(directorRepository, 'createQueryBuilder').mockReturnValue(mockDeleteQB as any);
      jest.spyOn(directorRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.remove('director-1');

      expect(mockDeleteQB.execute).toHaveBeenCalled();
      expect(directorRepository.delete).toHaveBeenCalledWith('director-1');
    });

    it('should throw NotFoundException if not found', async () => {
      const mockDeleteQB = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      jest.spyOn(directorRepository, 'createQueryBuilder').mockReturnValue(mockDeleteQB as any);
      jest.spyOn(directorRepository, 'delete').mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove('director-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search directors', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockDirector]),
      };

      jest.spyOn(directorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.search('John');

      expect(result).toEqual([mockDirector]);
    });
  });

  describe('validateDirectors', () => {
    it('should validate directors', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockDirector);

      await expect(service.validateDirectors([{ id: 'director-1' }])).resolves.toBeUndefined();
    });

    it('should throw if invalid director', async () => {
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException());

      await expect(service.validateDirectors([{ id: 'invalid' }])).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
