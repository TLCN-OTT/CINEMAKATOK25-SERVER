import { Repository } from 'typeorm';
import { Code } from 'typeorm/browser';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ActorDto, CreateActorDto, UpdateActorDto } from '../dtos/actor.dto';
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
      throw new NotFoundException({
        message: `Actor with ID ${id} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }
    return actor;
  }
  async findById(id: string): Promise<EntityActor> {
    const actor = await this.actorRepository.findOne({
      where: { id },
    });
    if (!actor) {
      throw new NotFoundException({
        message: `Actor with ID ${id} not found`,
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
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
      )`,
        'DESC',
      )
      .getMany();
  }
  async validateActors(actorDtos: any[]): Promise<void> {
    if (!actorDtos || actorDtos.length === 0) {
      return;
    }
    await Promise.all(
      actorDtos.map(async actorDto => {
        if (!actorDto.id || actorDto.id.length === 0) {
          return;
        }
        await this.findById(actorDto.id);
      }),
    );
  }

  async getTopActors(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;

    // QueryBuilder
    const qb = this.actorRepository
      .createQueryBuilder('actor')
      .leftJoin('actor.contents', 'content')
      .addSelect('COUNT(content.id)', 'content_count') // 👈 alias chữ thường có gạch dưới
      .groupBy('actor.id')
      .orderBy('content_count', 'DESC')
      .addOrderBy('actor.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Lấy cả raw lẫn entity
    const { entities, raw } = await qb.getRawAndEntities();

    // Ánh xạ thủ công giá trị COUNT
    const mapped = entities.map((actor, index) => ({
      ...actor,
      contentCount: Number(raw[index]?.content_count || 0),
    }));

    // Tổng số actor (dựa trên tổng dòng group)
    const total = mapped.length;

    return { data: mapped, total };
  }
}
