import { Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateMovieDto, UpdateMovieDto } from '../dtos/movies.dto';
import { EntityContent } from '../entities/content.entity';
import { EntityMovie } from '../entities/movie.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(EntityMovie)
    private readonly movieRepository: Repository<EntityMovie>,
    @InjectRepository(EntityContent)
    private readonly contentRepository: Repository<EntityContent>,
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<EntityMovie> {
    // First, create the content metadata
    const contentMetadata = this.contentRepository.create(createMovieDto.metaData);
    await this.contentRepository.save(contentMetadata);

    // Create the movie with the content metadata
    const movie = this.movieRepository.create({
      ...createMovieDto,
      metaData: contentMetadata,
    });

    return this.movieRepository.save(movie);
  }

  private buildMovieQuery(
    query: any = {},
    extraSelect?: string,
    extraOrder?: string,
    categoryId?: string,
  ) {
    const { sort, search } = query;
    const qb = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.metaData', 'metaData')
      .leftJoinAndSelect('metaData.categories', 'categories')
      .leftJoinAndSelect('metaData.tags', 'tags')
      .leftJoinAndSelect('metaData.actors', 'actors')
      .leftJoinAndSelect('metaData.directors', 'directors');
    if (categoryId) {
      console.log('Category ID filter:', categoryId);
      qb.where('categories.id = :categoryId', { categoryId });
    }

    if (extraSelect) qb.addSelect(extraSelect, extraOrder || undefined);

    if (search) {
      qb.where(`similarity(metaData.title, :search) > 0.2`)
        .orWhere(`similarity(metaData.description, :search) > 0.2`)
        .setParameter('search', search)
        .addSelect(
          `GREATEST(similarity(metaData.title, :search), similarity(metaData.description, :search))`,
          'rank',
        )
        .orderBy('rank', 'DESC');
    }

    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      Object.keys(sortObj).forEach(key => {
        const field = key.includes('.') ? key : `movie.${key}`;
        qb.addOrderBy(field, sortObj[key]);
      });
    } else if (!search && !extraOrder) {
      qb.orderBy('movie.createdAt', 'DESC');
    }

    return qb;
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10 } = query || {};
    const qb = this.buildMovieQuery(query);
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<EntityMovie> {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.metaData', 'metaData')
      .leftJoinAndSelect('metaData.categories', 'categories')
      .leftJoinAndSelect('metaData.actors', 'actors')
      .leftJoinAndSelect('metaData.directors', 'directors')
      .leftJoinAndSelect('metaData.tags', 'tags')
      .leftJoinAndSelect('metaData.reviews', 'reviews')
      .where('movie.id = :id', { id })
      .getOne();

    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }
    console.log('Found movie:', movie);
    return movie;
  }

  async update(id: string, updateMovieDto: UpdateMovieDto): Promise<EntityMovie> {
    const movie = await this.findOne(id);

    // Update content metadata if provided
    if (updateMovieDto.metaData) {
      await this.contentRepository.save({
        ...movie.metaData,
        ...updateMovieDto.metaData,
      });
    }

    // Update movie properties
    const updatedMovie = {
      ...movie,
      ...updateMovieDto,
      metaData: movie.metaData, // Keep the existing metadata reference
    };

    return this.movieRepository.save(updatedMovie);
  }

  async delete(id: string): Promise<void> {
    const movie = await this.findOne(id);

    // First delete the content metadata
    await this.contentRepository.remove(movie.metaData);

    // Then delete the movie
    await this.movieRepository.remove(movie);
  }

  async getTrendingMovies(query?: any) {
    const { page = 1, limit = 10 } = query || {};
    const epoch = new Date('2020-01-01T00:00:00Z').getTime() / 1000;
    const hotness = `
      LOG(10, COALESCE(metaData.viewCount, 0) + COALESCE(metaData.rating, 0) * 100 + 1) +
      ((EXTRACT(EPOCH FROM movie.createdAt) - ${epoch}) / 45000)
    `;
    const qb = this.buildMovieQuery(query, hotness, 'hotness');
    qb.orderBy('hotness', 'DESC');
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total };
  }

  async getMoviesByCategory(categoryId: string, query?: any) {
    const { page = 1, limit = 10 } = query || {};
    const qb = this.buildMovieQuery(query, undefined, undefined, categoryId);
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    console.log('Movies in category:', data);
    return { data, total };
  }
}
