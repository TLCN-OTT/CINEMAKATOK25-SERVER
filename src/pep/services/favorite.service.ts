import { ContentType } from 'src/cms/entities/content.entity';
import { EntityMovie } from 'src/cms/entities/movie.entity';
import { ContentService } from 'src/cms/services/content.service';

import { Repository } from 'typeorm/repository/Repository.js';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateFavoriteDto, FavoriteContentDto } from '../dtos/favorite.dto';
import { EntityFavorite } from '../entities/favorite.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(EntityFavorite)
    private readonly favoriteRepository: Repository<EntityFavorite>,
    private readonly contentService: ContentService,
  ) {}
  async createFavorite(createFavoriteDto: CreateFavoriteDto, userId: string) {
    const content = await this.contentService.findContentById(createFavoriteDto.contentId);

    // Check if already favorited
    const existingFavorite = await this.favoriteRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: createFavoriteDto.contentId },
      },
    });

    if (existingFavorite) {
      throw new BadRequestException({
        message: 'Content already in favorites',
        code: ERROR_CODE.ALREADY_EXISTS,
      });
    }

    // Create favorite
    const favorite = this.favoriteRepository.create({
      user: { id: userId },
      content,
    });

    await this.favoriteRepository.save(favorite);

    return this.getFavoriteStatus(content.id, userId);
  }

  // Implement favorite service methods here

  async getFavoriteStatus(contentId: string, userId?: string) {
    const content = await this.contentService.findContentById(contentId);

    if (!content) {
      throw new NotFoundException({
        message: 'Content not found',
        code: ERROR_CODE.ENTITY_NOT_FOUND,
      });
    }

    // Get total favorites count
    const totalFavorites = await this.favoriteRepository.count({
      where: {
        content: { id: contentId },
      },
    });
    if (!userId) {
      return {
        totalFavorites,
        isFavorited: false,
      };
    }
    // Check if user has favorited
    const userFavorite = await this.favoriteRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
    });

    return {
      totalFavorites,
      isFavorited: !!userFavorite,
    };
  }

  async removeFavorite(contentId: string, userId: string) {
    const content = await this.contentService.findContentById(contentId);

    const favorite = await this.favoriteRepository.findOne({
      where: {
        user: { id: userId },
        content: { id: contentId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);

    return { message: 'Content removed from favorites successfully' };
  }

  async removeArrayFavorite(contentIds: string[], userId: string) {
    for (const contentId of contentIds) {
      const favorite = await this.favoriteRepository.findOne({
        where: {
          user: { id: userId },
          content: { id: contentId },
        },
      });
      if (favorite) {
        await this.favoriteRepository.remove(favorite);
      } else {
        throw new NotFoundException({
          message: `Favorite with content ID ${contentId} not found`,
          code: ERROR_CODE.ENTITY_NOT_FOUND,
        });
      }
    }

    return { message: 'Contents removed from favorites successfully' };
  }

  async getUserFavorites(userId: string) {
    const favorites = await this.favoriteRepository.find({
      where: {
        user: { id: userId },
      },
      relations: ['content'],
    });

    // Map và lấy thêm duration từ movie/tvseries
    const result = await Promise.all(
      favorites.map(async fav => {
        const content = fav.content;
        let duration: number | null = null;

        if (content.type === ContentType.MOVIE) {
          const movie = await this.favoriteRepository.manager
            .getRepository(EntityMovie)
            .createQueryBuilder('movie')
            .select(['movie.duration'])
            .where('movie.content_id = :contentId', { contentId: content.id })
            .getOne();

          duration = movie?.duration ?? null;
        }

        return {
          id: content.id,
          title: content.title,
          type: content.type,
          releaseDate: content.releaseDate,
          thumbnail: content.thumbnail,
          banner: content.banner,
          trailer: content.trailer,
          duration,
        };
      }),
    );

    return result;
  }
}
