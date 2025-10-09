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

  async findAll(): Promise<EntityMovie[]> {
    return this.movieRepository.find({
      relations: [
        'metaData',
        'metaData.categories',
        'metaData.tags',
        'metaData.actors',
        'metaData.directors',
      ],
    });
  }

  async findOne(id: string): Promise<EntityMovie> {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: [
        'metaData',
        'metaData.categories',
        'metaData.tags',
        'metaData.actors',
        'metaData.directors',
      ],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }

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
}
