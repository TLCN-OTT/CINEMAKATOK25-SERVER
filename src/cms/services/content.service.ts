import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  ContentFilterDto,
  ContentSortBy,
  CreateContentDto,
  SortOrder,
  UpdateContentDto,
} from '../dtos/content.dto';
import { ContentType, EntityContent } from '../entities/content.entity';
import { ActorService } from './actor.service';
import { CategoryService } from './category.service';
import { DirectorService } from './director.service';
import { TagService } from './tag.service';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(EntityContent)
    private readonly contentRepository: Repository<EntityContent>,
    private readonly actorService: ActorService,
    private readonly tagService: TagService,
    private readonly categoryService: CategoryService,
    private readonly directorService: DirectorService,
  ) {}

  async create(createDto: CreateContentDto) {
    // Validate and transform input data
    await this.actorService.validateActors(createDto.actors);
    await this.tagService.validateTags(createDto.tags);
    await this.categoryService.validateCategories(createDto.categories);
    await this.directorService.validateDirectors(createDto.directors);
    try {
      // Create new content
      const content = this.contentRepository.create({
        type: createDto.type,
        title: createDto.title,
        description: createDto.description,
        releaseDate: createDto.releaseDate,
        thumbnail: createDto.thumbnail,
        banner: createDto.banner,
        trailer: createDto.trailer,
        categories: createDto.categories,
        actors: createDto.actors,
        directors: createDto.directors,
        tags: createDto.tags,
      });

      return await this.contentRepository.save(content);
    } catch (error) {
      console.error('Error creating content:', error);
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to create content',
        error: error.message,
      });
    }
  }

  async update(id: string, updateDto: UpdateContentDto) {
    try {
      const content = await this.findOne(id);
      if (!content) {
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'Content not found',
        });
      }
      // Validate and transform input data
      await this.actorService.validateActors(updateDto.actors);
      await this.tagService.validateTags(updateDto.tags);
      await this.categoryService.validateCategories(updateDto.categories);

      Object.assign(content, {
        type: updateDto.type,
        title: updateDto.title,
        description: updateDto.description,
        releaseDate: updateDto.releaseDate,
        thumbnail: updateDto.thumbnail,
        banner: updateDto.banner,
        trailer: updateDto.trailer,
        categories: updateDto.categories,
        actors: updateDto.actors,
        directors: updateDto.directors,
        tags: updateDto.tags,
      });

      return await this.contentRepository.save(content);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to update content',
        error: error.message,
      });
    }
  }

  async delete(id: string) {
    const content = await this.findOne(id);
    if (!content) {
      throw new NotFoundException({
        code: ERROR_CODE.ENTITY_NOT_FOUND,
        message: 'Content not found',
      });
    }
    await this.contentRepository.remove(content);
  }

  async findAll(filter: ContentFilterDto) {
    const queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.tags', 'tag')
      .leftJoinAndSelect('content.categories', 'category')
      .leftJoinAndSelect('content.actors', 'actor')
      .leftJoinAndSelect('content.directors', 'director');

    // Apply filters
    if (filter.type) {
      queryBuilder.andWhere('content.type = :type', { type: filter.type });
    }

    if (filter.tagIds?.length) {
      queryBuilder.andWhere('tag.id IN (:...tagIds)', { tagIds: filter.tagIds });
    }

    if (filter.categoryIds?.length) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds: filter.categoryIds,
      });
    }

    if (filter.actorIds?.length) {
      queryBuilder.andWhere('actor.id IN (:...actorIds)', { actorIds: filter.actorIds });
    }

    if (filter.directorIds?.length) {
      queryBuilder.andWhere('director.id IN (:...directorIds)', {
        directorIds: filter.directorIds,
      });
    }

    if (filter.year) {
      queryBuilder.andWhere('EXTRACT(YEAR FROM content.releaseDate) = :year', {
        year: filter.year,
      });
    }

    if (filter.title) {
      queryBuilder.andWhere('content.title ILIKE :title', { title: `%${filter.title}%` });
    }

    // Apply sorting
    switch (filter.sortBy) {
      case ContentSortBy.VIEWS:
        queryBuilder.orderBy('content.viewCount', filter.order);
        break;
      case ContentSortBy.TITLE:
        queryBuilder.orderBy('content.title', filter.order);
        break;
      case ContentSortBy.DATE:
      default:
        queryBuilder.orderBy('content.releaseDate', filter.order || SortOrder.DESC);
        break;
    }

    // Apply pagination
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    // Split items into movies and TV series
    const movies = items.filter(item => item.type === ContentType.MOVIE);
    const tvSeries = items.filter(item => item.type === ContentType.TVSERIES);

    // Calculate totals for each type
    const totalMovies = movies.length;
    const totalTvSeries = tvSeries.length;

    return {
      items: {
        movies,
        tvSeries,
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        totalMovies,
        totalTvSeries,
      },
    };
  }

  async findOne(id: string) {
    return this.contentRepository.findOne({
      where: { id },
      relations: ['tags', 'categories', 'actors', 'directors'],
    });
  }
}
