import { In, Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateVideoDto, UpdateVideoDto } from '../dtos/video.dto';
import { EntityVideo, VideoOwnerType } from '../entities/video.entity';

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

  async findAll(query?: any) {
    const { page = 1, limit = 10, sort, search } = query || {};

    const queryBuilder = this.videoRepository.createQueryBuilder('video');

    if (search) {
      queryBuilder
        .where(`similarity(video.videoUrl, :search) > 0.2`)
        .setParameter('search', search)
        .addSelect(`similarity(video.videoUrl, :search)`, 'rank')
        .orderBy('rank', 'DESC');
    }

    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      Object.keys(sortObj).forEach(key => {
        queryBuilder.addOrderBy(`video.${key}`, sortObj[key]);
      });
    } else if (!search) {
      queryBuilder.orderBy('video.createdAt', 'DESC');
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
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
  async findByEpisodeIds(episodeIds: string[]): Promise<EntityVideo[]> {
    if (!episodeIds?.length) return [];

    return this.videoRepository.find({
      where: {
        ownerType: VideoOwnerType.EPISODE,
        ownerId: In(episodeIds),
      },
    });
  }

  async findByMovie(movieId: string): Promise<EntityVideo[]> {
    return this.videoRepository.find({
      where: {
        ownerType: VideoOwnerType.MOVIE,
        ownerId: movieId,
      },
    });
  }
  async validateVideos(videoIds: UpdateVideoDto[]): Promise<EntityVideo[]> {
    return this.videoRepository.find({
      where: { id: In(videoIds.map(v => v.id)) },
    });
  }

  async assignVideos(videos: EntityVideo[], id: string, videoType?: VideoOwnerType) {
    await Promise.all(
      videos.map(v =>
        this.videoRepository.update(v.id, {
          ownerType: videoType || VideoOwnerType.EPISODE,
          ownerId: id,
        }),
      ),
    );
  }

  async unassignVideosByEpisodeIds(episodeIds: string[]): Promise<void> {
    if (!episodeIds.length) {
      return;
    }

    await this.videoRepository.update(
      {
        ownerType: VideoOwnerType.EPISODE,
        ownerId: In(episodeIds),
      },
      {
        ownerType: null,
        ownerId: null,
      },
    );
  }
}
