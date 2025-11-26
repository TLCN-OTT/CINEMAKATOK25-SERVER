import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateTagDto, UpdateTagDto } from '../../dtos/tag.dto';
import { EntityTag } from '../../entities/tag.entity';
import { TagService } from '../tag.service';

describe('TagService', () => {
  let service: TagService;
  let tagRepository: Repository<EntityTag>;

  const mockContent = {
    id: 'content-1',
    title: 'Test Movie',
    type: 'MOVIE',
    releaseDate: new Date(),
  } as any;

  const mockTag = {
    id: 'tag-1',
    tagName: 'Action',
    contents: [mockContent],
    createdAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: getRepositoryToken(EntityTag),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    tagRepository = module.get<Repository<EntityTag>>(getRepositoryToken(EntityTag));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create tag', async () => {
      const createDto: CreateTagDto = { tagName: 'Comedy' };
      jest.spyOn(tagRepository, 'create').mockReturnValue(mockTag);
      jest.spyOn(tagRepository, 'save').mockResolvedValue(mockTag);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTag);
      expect(tagRepository.create).toHaveBeenCalledWith(createDto);
      expect(tagRepository.save).toHaveBeenCalledWith(mockTag);
    });
  });

  describe('findAll', () => {
    it('should return tags', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTag], 1]),
      };

      jest.spyOn(tagRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockTag]);
      expect(result.total).toBe(1);
    });

    it('should search tags', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTag], 1]),
      };

      jest.spyOn(tagRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll({ search: 'Action' });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        `
        tag.tagName ILIKE :likeQuery 
        OR similarity(tag.tagName, :query) > 0.3
        `,
        { likeQuery: '%Action%', query: 'Action' },
      );
    });
  });

  describe('findOne', () => {
    it('should return tag', async () => {
      jest.spyOn(tagRepository, 'findOne').mockResolvedValue(mockTag);

      const result = await service.findOne('tag-1');

      expect(result).toEqual(mockTag);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(tagRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('tag-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return tag', async () => {
      jest.spyOn(tagRepository, 'findOne').mockResolvedValue(mockTag);

      const result = await service.findById('tag-1');

      expect(result).toEqual(mockTag);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(tagRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('tag-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateTagDto = { id: 'tag-1', tagName: 'Updated Tag' };

    it('should update tag', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTag);
      jest.spyOn(tagRepository, 'save').mockResolvedValue({ ...mockTag, ...updateDto });

      const result = await service.update('tag-1', updateDto);

      expect(result.tagName).toBe('Updated Tag');
    });
  });

  describe('remove', () => {
    it('should remove tag', async () => {
      const mockDeleteQB = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      jest.spyOn(tagRepository, 'createQueryBuilder').mockReturnValue(mockDeleteQB as any);
      jest.spyOn(tagRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.remove('tag-1');

      expect(mockDeleteQB.execute).toHaveBeenCalled();
      expect(tagRepository.delete).toHaveBeenCalledWith('tag-1');
    });

    it('should throw NotFoundException if not found', async () => {
      const mockDeleteQB = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      jest.spyOn(tagRepository, 'createQueryBuilder').mockReturnValue(mockDeleteQB as any);
      jest.spyOn(tagRepository, 'delete').mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove('tag-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search tags', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTag]),
      };

      jest.spyOn(tagRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.search('Action');

      expect(result).toEqual([mockTag]);
    });
  });

  describe('validateTags', () => {
    it('should validate tags', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockTag);

      await expect(service.validateTags([{ id: 'tag-1' }])).resolves.toBeUndefined();
    });

    it('should throw if invalid tag', async () => {
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException());

      await expect(service.validateTags([{ id: 'invalid' }])).rejects.toThrow(NotFoundException);
    });
  });
});
