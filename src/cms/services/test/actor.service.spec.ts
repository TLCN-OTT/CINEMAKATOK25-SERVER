import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { GENDER } from '@app/common/enums/global.enum';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateActorDto, UpdateActorDto } from '../../dtos/actor.dto';
import { EntityActor } from '../../entities/actor.entity';
import { ActorService } from '../actor.service';

describe('ActorService', () => {
  let service: ActorService;
  let actorRepository: Repository<EntityActor>;

  const mockContent = {
    id: 'content-1',
    title: 'Test Movie',
    type: 'MOVIE',
    releaseDate: new Date(),
  } as any;

  const mockActor = {
    id: 'actor-1',
    name: 'John Doe',
    nationality: 'American',
    contents: [mockContent],
    createdAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActorService,
        {
          provide: getRepositoryToken(EntityActor),
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

    service = module.get<ActorService>(ActorService);
    actorRepository = module.get<Repository<EntityActor>>(getRepositoryToken(EntityActor));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create actor', async () => {
      const createDto: CreateActorDto = {
        name: 'Jane Doe',
        nationality: 'British',
        bio: 'An actor bio',
        dateOfBirth: new Date('1990-01-01'),
        gender: GENDER.MALE,
        profilePicture: 'http://example.com/pic.jpg',
      };
      jest.spyOn(actorRepository, 'create').mockReturnValue(mockActor);
      jest.spyOn(actorRepository, 'save').mockResolvedValue(mockActor);

      const result = await service.create(createDto);

      expect(result).toEqual(mockActor);
      expect(actorRepository.create).toHaveBeenCalledWith(createDto);
      expect(actorRepository.save).toHaveBeenCalledWith(mockActor);
    });
  });

  describe('findAll', () => {
    it('should return actors', async () => {
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
        getManyAndCount: jest.fn().mockResolvedValue([[mockActor], 1]),
      };

      jest.spyOn(actorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockActor]);
      expect(result.total).toBe(1);
    });

    it('should search actors', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockActor], 1]),
      };

      jest.spyOn(actorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll({ search: 'John' });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(`similarity(actor.name, :search) > 0.2`);
    });
  });

  describe('findOne', () => {
    it('should return actor with enrichment', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockActor),
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

      jest.spyOn(actorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest
        .spyOn(actorRepository.manager, 'createQueryBuilder')
        .mockReturnValueOnce(mockMovieQB as any)
        .mockReturnValueOnce(mockTVQB as any);

      const result = await service.findOne('actor-1');

      expect(result.contents[0].movieOrSeriesId).toBe('movie-1');
      expect(result.contents[0].duration).toBe(120);
    });

    it('should throw NotFoundException if not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(actorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await expect(service.findOne('actor-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return actor', async () => {
      jest.spyOn(actorRepository, 'findOne').mockResolvedValue(mockActor);

      const result = await service.findById('actor-1');

      expect(result).toEqual(mockActor);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(actorRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('actor-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateActorDto = { name: 'Updated Name', nationality: 'Canadian' } as any;

    it('should update actor', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockActor);
      jest.spyOn(actorRepository, 'save').mockResolvedValue({ ...mockActor, ...updateDto });

      const result = await service.update('actor-1', updateDto);

      expect(result.name).toBe('Updated Name');
    });
    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
      await expect(service.update('actor-1', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove actor', async () => {
      const mockDeleteQB = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(null),
      };
      jest.spyOn(actorRepository, 'createQueryBuilder').mockReturnValue(mockDeleteQB as any);
      jest.spyOn(actorRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.remove('actor-1');

      expect(mockDeleteQB.execute).toHaveBeenCalled();
      expect(actorRepository.delete).toHaveBeenCalledWith('actor-1');
    });

    it('should throw NotFoundException if not found', async () => {
      const mockDeleteQB = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(null),
      };
      jest.spyOn(actorRepository, 'createQueryBuilder').mockReturnValue(mockDeleteQB as any);
      jest.spyOn(actorRepository, 'delete').mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove('actor-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search actors', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockActor]),
      };

      jest.spyOn(actorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.search('John');

      expect(result).toEqual([mockActor]);
    });
  });

  describe('validateActors', () => {
    it('should validate actors', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockActor);

      await expect(service.validateActors([{ id: 'actor-1' }])).resolves.toBeUndefined();
    });

    it('should throw if invalid actor', async () => {
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException());

      await expect(service.validateActors([{ id: 'invalid' }])).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTopActors', () => {
    it('should return top actors', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockActor],
          raw: [{ content_count: 5 }],
        }),
      };

      jest.spyOn(actorRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTopActors({ page: 1, limit: 10 });

      expect(result.data[0].contentCount).toBe(5);
    });
  });
});
