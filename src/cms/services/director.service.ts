import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
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

  async findAll(query?: any) {
    const { page = 1, limit = 10, sort, search } = query || {};

    const queryBuilder = this.directorRepository
      .createQueryBuilder('director')
      .leftJoinAndSelect('director.contents', 'contents');

    if (search) {
      queryBuilder
        .where(`similarity(director.name, :search) > 0.2`)
        .orWhere(`similarity(director.nationality, :search) > 0.2`)
        .setParameter('search', search)
        // thêm cột "rank" để sắp xếp theo độ giống cao nhất
        .addSelect(
          `
        GREATEST(
          similarity(director.name, :search),
          similarity(director.nationality, :search)
        )
      `,
          'rank',
        )
        .orderBy('rank', 'DESC');
    }

    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      Object.keys(sortObj).forEach(key => {
        queryBuilder.addOrderBy(`director.${key}`, sortObj[key]);
      });
    } else if (!search) {
      queryBuilder.orderBy('director.createdAt', 'DESC');
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
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
  async findById(id: string): Promise<EntityDirector> {
    const director = await this.directorRepository.findOne({
      where: { id },
    });
    if (!director) {
      throw new NotFoundException({
        message: `Director with ID ${id} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }
    return director;
  }

  async validateDirectors(directors: any[]): Promise<void> {
    if (!directors || directors.length === 0) {
      return;
    }
    await Promise.all(
      directors.map(async directorDto => {
        if (!directorDto.id || directorDto.id.length === 0) {
          return;
        }
        await this.findById(directorDto.id);
      }),
    );
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
