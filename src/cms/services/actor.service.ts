import { Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateActorDto, UpdateActorDto } from '../dtos/actor.dto';
import { EntityActor } from '../entities/actor.entity';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(EntityActor)
    private readonly actorRepository: Repository<EntityActor>,
  ) {}

  async create(createActorDto: CreateActorDto): Promise<EntityActor> {
    const actor = this.actorRepository.create(createActorDto);
    return await this.actorRepository.save(actor);
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10, sort, search } = query || {};

    const queryBuilder = this.actorRepository
      .createQueryBuilder('actor')
      .leftJoinAndSelect('actor.contents', 'contents');

    if (search) {
      queryBuilder
        .where(`similarity(actor.name, :search) > 0.2`)
        .orWhere(`similarity(actor.nationality, :search) > 0.2`)
        .setParameter('search', search)
        // ⚠️ orderBy phải dùng addSelect để tính toán similarity trước
        .addSelect(
          `
        GREATEST(
          similarity(actor.name, :search),
          similarity(actor.nationality, :search)
        )
      `,
          'rank',
        )
        .orderBy('rank', 'DESC');
    }

    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      Object.keys(sortObj).forEach(key => {
        queryBuilder.addOrderBy(`actor.${key}`, sortObj[key]);
      });
    } else if (!search) {
      queryBuilder.orderBy('actor.createdAt', 'DESC');
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<EntityActor> {
    const actor = await this.actorRepository.findOne({
      where: { id },
      relations: ['contents'],
    });
    if (!actor) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
    return actor;
  }

  async update(id: string, updateActorDto: UpdateActorDto): Promise<EntityActor> {
    const actor = await this.findOne(id);
    Object.assign(actor, updateActorDto);
    return await this.actorRepository.save(actor);
  }

  async remove(id: string): Promise<void> {
    const result = await this.actorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
  }

  async search(query: string): Promise<EntityActor[]> {
    return await this.actorRepository
      .createQueryBuilder('actor')
      .leftJoinAndSelect('actor.contents', 'contents')
      .where(
        `
      actor.name ILIKE :likeQuery
      OR actor.nationality ILIKE :likeQuery
      OR similarity(actor.name, :query) > 0.3
      OR similarity(actor.nationality, :query) > 0.3
    `,
        { likeQuery: `%${query}%`, query },
      )
      .orderBy(
        `
      GREATEST(
        similarity(actor.name, :query),
        similarity(actor.nationality, :query)
      )
    `,
        'DESC',
      )
      .getMany();
  }
}
