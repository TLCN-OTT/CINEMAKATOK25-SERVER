import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateContentDto, UpdateContentDto } from '../dtos/content.dto';
import { EntityActor, EntityDirector } from '../entities/actor.entity';
import { EntityCategory } from '../entities/category.entity';
import { EntityContent } from '../entities/content.entity';
import { EntityTag } from '../entities/tag.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(EntityContent)
    private readonly contentRepository: Repository<EntityContent>,
  ) {}

  async create(createDto: CreateContentDto) {
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

  async findAll() {
    const contents = await this.contentRepository.find({
      relations: ['categories', 'actors', 'directors', 'tags'],
    });

    return contents;
  }

  async findOne(id: string) {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['categories', 'actors', 'directors', 'tags'],
    });

    if (!content) {
      throw new NotFoundException({
        code: ERROR_CODE.ENTITY_NOT_FOUND,
        message: 'Content not found',
      });
    }

    return content;
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
}
