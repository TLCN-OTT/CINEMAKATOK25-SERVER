import e from 'express';
import { In, Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTVSeriesDto, UpdateTVSeriesDto } from '../dtos/tvseries.dto';
import { UpdateVideoDto } from '../dtos/video.dto';
import { ContentType } from '../entities/content.entity';
import { EntityEpisode, EntitySeason, EntityTVSeries } from '../entities/tvseries.entity';
import { EntityVideo, VideoOwnerType } from '../entities/video.entity';
import { ContentService } from './content.service';
import { VideoService } from './video.service';

@Injectable()
export class TvSeriesService {
  constructor(
    @InjectRepository(EntityTVSeries)
    private readonly tvSeriesRepository: Repository<EntityTVSeries>,
    private readonly contentService: ContentService,
    @InjectRepository(EntitySeason)
    private readonly seasonRepository: Repository<EntitySeason>,
    @InjectRepository(EntityEpisode)
    private readonly episodeRepository: Repository<EntityEpisode>,
    private readonly videoService: VideoService,
  ) {}

  /**
   * Helper gắn video vào episodes
   */
  private async _attachVideosToEpisodes(tvSeriesList: EntityTVSeries[]) {
    const episodeIds = tvSeriesList
      .flatMap(tv => tv.seasons?.flatMap(s => s.episodes?.map(ep => ep.id)))
      .filter(Boolean);

    if (!episodeIds?.length) return tvSeriesList;

    const videos = await this.videoService.findByEpisodeIds(episodeIds);

    tvSeriesList.forEach(tv =>
      tv.seasons?.forEach(season =>
        season.episodes?.forEach(ep => {
          // ✅ Chỉ gắn 1 video duy nhất thay vì mảng
          const video = videos.find(v => v.ownerId === ep.id);
          ep['video'] = video || null;
        }),
      ),
    );

    return tvSeriesList;
  }

  /**
   * Lấy danh sách TV series (có gắn videos)
   */
  async findAll(query?: any) {
    const { page = 1, limit = 10, sort, search } = query || {};

    const qb = this.tvSeriesRepository
      .createQueryBuilder('tvseries')
      .leftJoinAndSelect('tvseries.metaData', 'metaData')
      .leftJoinAndSelect('metaData.categories', 'categories')
      .leftJoinAndSelect('metaData.tags', 'tags')
      .leftJoinAndSelect('metaData.actors', 'actors')
      .leftJoinAndSelect('metaData.directors', 'directors')
      .leftJoinAndSelect('tvseries.seasons', 'seasons')
      .leftJoinAndSelect('seasons.episodes', 'episodes');

    if (search) {
      qb.where(`similarity(metaData.title, :search) > 0.2`)
        .orWhere(`similarity(metaData.description, :search) > 0.2`)
        .setParameter('search', search)
        .addSelect(
          `GREATEST(
            similarity(metaData.title, :search),
            similarity(metaData.description, :search)
          )`,
          'rank',
        )
        .orderBy('rank', 'DESC');
    }

    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      Object.entries(sortObj).forEach(([key, dir]) => {
        const field = key.includes('.') ? key : `tvseries.${key}`;
        qb.addOrderBy(field, dir as 'ASC' | 'DESC');
      });
    } else if (!search) {
      qb.orderBy('tvseries.createdAt', 'DESC');
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const resultWithVideos = await this._attachVideosToEpisodes(data);
    return { data: resultWithVideos, total };
  }

  /**
   * Lấy 1 TV series chi tiết
   */
  async findOne(id: string) {
    const tvSeries = await this.tvSeriesRepository
      .createQueryBuilder('tv')
      .leftJoinAndSelect('tv.metaData', 'meta')
      .leftJoinAndSelect('meta.categories', 'categories')
      .leftJoinAndSelect('meta.tags', 'tags')
      .leftJoinAndSelect('meta.actors', 'actors')
      .leftJoinAndSelect('meta.directors', 'directors')
      .leftJoinAndSelect('tv.seasons', 'seasons')
      .leftJoinAndSelect('seasons.episodes', 'episodes')
      .where('tv.id = :id', { id })
      .getOne();

    if (!tvSeries) {
      throw new NotFoundException({
        code: ERROR_CODE.ENTITY_NOT_FOUND,
        message: 'TV series not found',
      });
    }

    const [tvSeriesWithVideos] = await this._attachVideosToEpisodes([tvSeries]);
    return tvSeriesWithVideos;
  }

  /**
   * Tạo mới
   */
  async create(createDto: CreateTVSeriesDto): Promise<EntityTVSeries> {
    const queryRunner = this.tvSeriesRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { seasons = [], metaData } = createDto;

      const content = await this.contentService.create({
        ...metaData,
        type: ContentType.TVSERIES,
      });

      const tvSeries = this.tvSeriesRepository.create({ metaData: content });
      await queryRunner.manager.save(tvSeries);

      if (seasons.length) {
        const seasonEntities = seasons.map(seasonDto =>
          this.seasonRepository.create({
            seasonNumber: seasonDto.seasonNumber,
            totalEpisodes: seasonDto.episodes?.length ?? 0,
            tvseries: tvSeries,
          }),
        );
        await queryRunner.manager.save(seasonEntities);

        const episodeEntities: EntityEpisode[] = [];
        const episodeVideoRequests: Array<{ episode: EntityEpisode; video: UpdateVideoDto }> = [];

        seasonEntities.forEach((seasonEntity, index) => {
          const seasonDto = seasons[index];
          const episodes = seasonDto.episodes ?? [];

          episodes.forEach(episodeDto => {
            const episode = this.episodeRepository.create({
              ...episodeDto,
              season: seasonEntity,
            });

            episodeEntities.push(episode);

            // ✅ Chỉ xử lý 1 video thay vì mảng
            if (episodeDto.video) {
              episodeVideoRequests.push({
                episode,
                video: episodeDto.video,
              });
            }
          });
        });

        if (episodeEntities.length) {
          await queryRunner.manager.save(episodeEntities);
        }

        if (episodeVideoRequests.length) {
          const videoDtos = episodeVideoRequests.map(request => request.video);
          const validVideos = await this.videoService.validateVideos(videoDtos);
          const videoMap = new Map(validVideos.map(video => [video.id, video]));

          for (const request of episodeVideoRequests) {
            const video = videoMap.get(request.video.id);

            if (!video) {
              throw new BadRequestException({
                code: ERROR_CODE.INVALID_BODY,
                message: 'Video không tồn tại hoặc không hợp lệ',
              });
            }

            await this.videoService.assignVideos(
              [video],
              request.episode.id,
              VideoOwnerType.EPISODE,
            );
          }
        }
      }

      await queryRunner.commitTransaction();

      return await this.findOne(tvSeries.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cập nhật
   */
  async update(id: string, dto: UpdateTVSeriesDto) {
    const queryRunner = this.tvSeriesRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { seasons, metaData } = dto;
      const tvSeries = await this.findOne(id);

      // Update metadata
      if (metaData) {
        await this.contentService.update(metaData.id, metaData);
      }

      // Handle seasons
      if (seasons && seasons.length > 0) {
        const existingSeasonIds = tvSeries.seasons?.map(s => s.id) ?? [];
        const requestSeasonIds = seasons.filter(s => s.id).map(s => s.id);

        // --- Unlink videos of episodes in deleted seasons ---
        const toDeleteSeasonIds = existingSeasonIds.filter(id => !requestSeasonIds.includes(id));
        if (toDeleteSeasonIds.length) {
          const episodesToDelete = await this.episodeRepository.find({
            where: { season: { id: In(toDeleteSeasonIds) } },
          });

          const episodeIds = episodesToDelete.map(ep => ep.id);
          if (episodeIds.length) {
            await this.videoService.unassignVideosByEpisodeIds(episodeIds);
          }

          await queryRunner.manager.delete(this.episodeRepository.target, episodeIds);
          await queryRunner.manager.delete(this.seasonRepository.target, toDeleteSeasonIds);
        }

        // Loop qua request seasons
        for (const seasonDto of seasons) {
          let seasonEntity;

          if (seasonDto.id) {
            seasonEntity = await this.seasonRepository.findOne({
              where: { id: seasonDto.id },
              relations: ['episodes'],
            });

            if (!seasonEntity) {
              throw new NotFoundException({
                message: `Season with id ${seasonDto.id} not found`,
                code: ERROR_CODE.ENTITY_NOT_FOUND,
              });
            }

            seasonEntity.totalEpisodes = seasonDto.episodes?.length ?? 0;
            await queryRunner.manager.save(seasonEntity);
          } else {
            seasonEntity = this.seasonRepository.create({
              seasonNumber: seasonDto.seasonNumber,
              totalEpisodes: seasonDto.episodes?.length ?? 0,
              tvseries: tvSeries,
            });
            await queryRunner.manager.save(seasonEntity);
          }

          // Handle episodes
          const existingEpisodeIds = seasonEntity.episodes?.map(e => e.id) ?? [];
          const requestEpisodeIds = (seasonDto.episodes ?? []).filter(e => e.id).map(e => e.id);

          // Unlink videos of deleted episodes
          const toDeleteEpisodeIds = existingEpisodeIds.filter(
            id => !requestEpisodeIds.includes(id),
          );
          if (toDeleteEpisodeIds.length) {
            await this.videoService.unassignVideosByEpisodeIds(toDeleteEpisodeIds);
            await queryRunner.manager.delete(this.episodeRepository.target, toDeleteEpisodeIds);
          }

          for (const epDto of seasonDto.episodes ?? []) {
            if (epDto.id) {
              const existingEpisode = await this.episodeRepository.findOne({
                where: { id: epDto.id },
              });

              if (!existingEpisode) {
                throw new NotFoundException({
                  message: `Episode with id ${epDto.id} not found`,
                  code: ERROR_CODE.ENTITY_NOT_FOUND,
                });
              }

              // ✅ Tách video ra khỏi episodeData
              const { video, ...episodeData } = epDto;

              await queryRunner.manager.update(this.episodeRepository.target, epDto.id, {
                ...episodeData,
                season: seasonEntity,
              });

              // ✅ Xử lý video (chỉ 1 video)
              if (video) {
                // Unlink video cũ trước
                await this.videoService.unassignVideosByEpisodeIds([epDto.id]);

                // Validate và assign video mới
                const validVideos = await this.videoService.validateVideos([video]);
                if (!validVideos.length) {
                  throw new BadRequestException({
                    code: ERROR_CODE.INVALID_BODY,
                    message: 'Video không tồn tại hoặc không hợp lệ',
                  });
                }

                await this.videoService.assignVideos(validVideos, epDto.id, VideoOwnerType.EPISODE);
              } else {
                // Nếu không có video trong request, unlink video hiện tại
                await this.videoService.unassignVideosByEpisodeIds([epDto.id]);
              }
            } else {
              // Tạo episode mới
              const { video, ...episodeData } = epDto;

              const newEp = this.episodeRepository.create({
                ...episodeData,
                season: seasonEntity,
              });
              const savedEp = await queryRunner.manager.save(newEp);

              // ✅ Assign video nếu có
              if (video) {
                const validVideos = await this.videoService.validateVideos([video]);
                if (!validVideos.length) {
                  throw new BadRequestException({
                    code: ERROR_CODE.INVALID_BODY,
                    message: 'Video không tồn tại hoặc không hợp lệ',
                  });
                }

                await this.videoService.assignVideos(
                  validVideos,
                  savedEp.id,
                  VideoOwnerType.EPISODE,
                );
              }
            }
          }
        }
      } else {
        // Nếu seasons gửi về là rỗng, xoá hết seasons cũ
        const existingSeasons = await this.seasonRepository.find({
          where: { tvseries: { id } },
        });
        const existingSeasonIds = existingSeasons.map(s => s.id);
        const episodesToDelete = await this.episodeRepository.find({
          where: { season: { id: In(existingSeasonIds) } },
        });

        if (existingSeasonIds.length) {
          await this.videoService.unassignVideosByEpisodeIds(episodesToDelete.map(e => e.id));
        }
        await queryRunner.manager.delete(this.episodeRepository.target, {
          id: In(episodesToDelete.map(e => e.id)),
        });
        await queryRunner.manager.delete(this.seasonRepository.target, existingSeasonIds);
      }

      await queryRunner.commitTransaction();

      const [resultWithVideos] = await this._attachVideosToEpisodes([await this.findOne(id)]);
      return resultWithVideos;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Xoá
   */
  async delete(id: string) {
    const queryRunner = this.tvSeriesRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tvSeries = await queryRunner.manager.findOne(EntityTVSeries, {
        where: { id },
        relations: ['metaData'],
      });

      if (!tvSeries) {
        throw new BadRequestException('TV series not found');
      }

      // ✅ Lấy toàn bộ episodeIds của TVSeries để xóa video tương ứng
      const episodes = await queryRunner.manager.find(EntityEpisode, {
        where: { season: { tvseries: { id } } },
        select: ['id'],
      });
      const episodeIds = episodes.map(e => e.id);

      if (episodeIds.length) {
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(EntityVideo)
          .where('ownerType = :type', { type: VideoOwnerType.EPISODE })
          .andWhere('ownerId IN (:...ids)', { ids: episodeIds })
          .execute();
      }

      await queryRunner.manager.remove(tvSeries);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
