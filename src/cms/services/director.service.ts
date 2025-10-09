import { Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateDirectorDto, UpdateDirectorDto } from '../dtos/director.dto';
import { EntityDirector } from '../entities/actor.entity';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(EntityDirector)
    private readonly directorRepository: Repository<EntityDirector>,
  ) {}

  async create(createDirectorDto: CreateDirectorDto): Promise<EntityDirector> {
    const director = this.directorRepository.create(createDirectorDto);
    return await this.directorRepository.save(director);
  }

  async findAll(): Promise<EntityDirector[]> {
    return await this.directorRepository.find();
  }

  async findOne(id: string): Promise<EntityDirector> {
    const director = await this.directorRepository.findOne({
      where: { id },
      relations: ['contents'],
    });
    if (!director) {
      throw new NotFoundException(`Director with ID ${id} not found`);
    }
    return director;
  }

  async update(id: string, updateDirectorDto: UpdateDirectorDto): Promise<EntityDirector> {
    const director = await this.findOne(id);
    Object.assign(director, updateDirectorDto);
    return await this.directorRepository.save(director);
  }

  async remove(id: string): Promise<void> {
    const result = await this.directorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Director with ID ${id} not found`);
    }
  }

  async search(query: string): Promise<EntityDirector[]> {
    return await this.directorRepository
      .createQueryBuilder('director')
      .leftJoinAndSelect('director.contents', 'contents')
      .where(
        `
      director.name ILIKE :likeQuery
      OR director.nationality ILIKE :likeQuery
      OR similarity(director.name, :query) > 0.3
      OR similarity(director.nationality, :query) > 0.3
    `,
        { likeQuery: `%${query}%`, query },
      )
      .orderBy(
        `
      GREATEST(similarity(director.name, :query),
               similarity(director.nationality, :query))`,
        'DESC',
      )
      .getMany();
  }
}
