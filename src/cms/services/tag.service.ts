import { Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTagDto, UpdateTagDto } from '../dtos/tag.dto';
import { EntityTag } from '../entities/tag.entity';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(EntityTag)
    private readonly tagRepository: Repository<EntityTag>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<EntityTag> {
    const tag = this.tagRepository.create(createTagDto);
    return await this.tagRepository.save(tag);
  }

  async findAll(): Promise<EntityTag[]> {
    return await this.tagRepository.find({
      relations: ['contents'],
    });
  }

  async findOne(id: string): Promise<EntityTag> {
    const tag = await this.tagRepository.findOne({
      where: { id },
      relations: ['contents'],
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<EntityTag> {
    const tag = await this.findOne(id);
    Object.assign(tag, updateTagDto);
    return await this.tagRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tagRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
  }

  async search(query: string): Promise<EntityTag[]> {
    return await this.tagRepository
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.contents', 'contents')
      .where(
        `
        tag.tagName ILIKE :likeQuery 
        OR similarity(tag.tagName, :query) > 0.3
        `,
        { likeQuery: `%${query}%`, query },
      )
      .orderBy('similarity(tag.tagName, :query)', 'DESC')
      .getMany();
  }
}
