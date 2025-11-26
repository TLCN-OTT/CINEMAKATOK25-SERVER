import { Not, Repository } from 'typeorm';

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CreateCategoryDto, UpdateCategoryDto } from '../../dtos/category.dto';
import { EntityCategory } from '../../entities/category.entity';
import { CategoryService } from '../category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: Repository<EntityCategory>;

  const mockCategoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(EntityCategory),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get<Repository<EntityCategory>>(getRepositoryToken(EntityCategory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createDto: CreateCategoryDto = { categoryName: 'Action' };
      const mockCategory = { id: '1', ...createDto };

      mockCategoryRepository.create.mockReturnValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(createDto);

      expect(mockCategoryRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockCategoryRepository.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: '1', categoryName: 'Action' },
        { id: '2', categoryName: 'Comedy' },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCategories, 2]),
      };

      jest
        .spyOn(mockCategoryRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockCategories);
      expect(result.total).toBe(2);
    });
    it('should search categories', async () => {
      const mockCategories = [{ id: '1', categoryName: 'Action' }];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCategories, 1]),
      };
      jest
        .spyOn(mockCategoryRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);
      await service.findAll({ search: 'Action' });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        `similarity(category.categoryName, :search) > 0.2`,
      );
    });
    it('should sort categories', async () => {
      const mockCategories = [
        { id: '1', categoryName: 'Action' },
        { id: '2', categoryName: 'Comedy' },
      ];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCategories, 2]),
      };

      jest
        .spyOn(mockCategoryRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);
      await service.findAll({ sort: JSON.stringify({ categoryName: 'ASC' }) });

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(`category.categoryName`, 'ASC');
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const mockCategory = { id: '1', categoryName: 'Action' };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne('1');

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['contents'],
      });
      expect(result).toEqual(mockCategory);
    });
    it('should return null if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return a category by id', async () => {
      const mockCategory = { id: '1', categoryName: 'Action' };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findById('1');

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateCategories', () => {
    it('should validate categories successfully', async () => {
      const categoryDtos = [{ id: '1' }];
      const mockCategory = { id: '1', categoryName: 'Action' };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.validateCategories(categoryDtos)).resolves.not.toThrow();
    });
    it('should throw NotFoundException if any category is invalid', async () => {
      const categoryDtos = [{ id: '1' }, { id: '2' }];

      mockCategoryRepository.findOne
        .mockResolvedValueOnce({ id: '1', categoryName: 'Action' }) // valid
        .mockResolvedValueOnce(null); // invalid

      await expect(service.validateCategories(categoryDtos)).rejects.toThrow(NotFoundException);
    });
    it('should return immediately if no categories provided', async () => {
      await expect(service.validateCategories([])).resolves.not.toThrow();
    });
    it('should skip validation if category id is empty', async () => {
      const categoryDtos = [{ id: '' }];

      const findByIdSpy = jest.spyOn(service, 'findById');

      await service.validateCategories(categoryDtos);

      expect(findByIdSpy).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto: UpdateCategoryDto = { id: '1', categoryName: 'Updated Action' };
      const mockCategory = { id: '1', categoryName: 'Updated Action' };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(mockCategory);

      const result = await service.update('1', updateDto);

      expect(mockCategoryRepository.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      const queryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(categoryRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      mockCategoryRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockCategoryRepository.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('search', () => {
    it('should search categories', async () => {
      const mockCategories = [{ id: '1', categoryName: 'Action' }];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockCategoryRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      queryBuilder.getMany.mockResolvedValue(mockCategories);

      const result = await service.search('Action');

      expect(result).toEqual(mockCategories);
    });
  });

  describe('findAllWithTVSeriesCount', () => {
    it('should return categories with TV series count', async () => {
      const mockCategories = [{ id: '1', categoryName: 'Action', tvSeriesCount: 5 }];
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockCategoryRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      queryBuilder.getMany.mockResolvedValue(mockCategories);

      const result = await service.findAllWithTVSeriesCount();

      expect(result).toEqual(mockCategories);
    });
  });
});
