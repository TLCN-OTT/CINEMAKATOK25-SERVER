import { Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateVideoDto, UpdateVideoDto } from '../dtos/video.dto';
import { EntityVideo } from '../entities/video.entity';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(EntityVideo)
    private readonly videoRepository: Repository<EntityVideo>,
  ) {}

  async create(createDto: CreateVideoDto) {
    try {
      const video = this.videoRepository.create({
        videoUrl: createDto.videoUrl,
        resolution: createDto.resolution,
      });
      return await this.videoRepository.save(video);
    } catch (error) {
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to create video',
        error: error.message,
      });
    }
  }

  async findAll() {
    return await this.videoRepository.find();
  }

  async findOne(id: string) {
    const video = await this.videoRepository.findOne({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException({
        code: ERROR_CODE.ENTITY_NOT_FOUND,
        message: 'Video not found',
      });
    }

    return video;
  }

  async update(id: string, updateDto: UpdateVideoDto) {
    try {
      const video = await this.findOne(id);
      if (!video) {
        throw new NotFoundException({
          code: ERROR_CODE.ENTITY_NOT_FOUND,
          message: 'Video not found',
        });
      }

      Object.assign(video, {
        videoUrl: updateDto.videoUrl,
        resolution: updateDto.resolution,
      });

      return await this.videoRepository.save(video);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERROR_CODE.UNEXPECTED_ERROR,
        message: 'Failed to update video',
        error: error.message,
      });
    }
  }

  async delete(id: string) {
    const video = await this.findOne(id);
    if (!video) {
      throw new NotFoundException({
        code: ERROR_CODE.ENTITY_NOT_FOUND,
        message: 'Video not found',
      });
    }
    await this.videoRepository.remove(video);
  }
}
