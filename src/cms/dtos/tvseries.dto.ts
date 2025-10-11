import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';

import { ContentDto, UpdateContentDto } from './content.dto';
import { CreateEpisodeDto, EpisodeDto, UpdateEpisodeDto } from './episode.dto';
import { VideoDto } from './video.dto';

export class SeasonDto extends BaseEntityDto {
  @ApiProperty({
    description: 'Season number',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  seasonNumber: number;

  @ApiProperty({
    description: 'Total number of episodes in the season',
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  totalEpisodes: number;

  @ApiProperty({
    description: 'List of episode information',
    type: [EpisodeDto],
  })
  @Type(() => EpisodeDto)
  @ValidateNested({ each: true })
  @Expose()
  episodes: EpisodeDto[];
}
export class CreateSeasonDto extends OmitType(SeasonDto, [
  'id',
  'createdAt',
  'updatedAt',
  'totalEpisodes',
  'episodes',
]) {
  @ApiProperty({
    description: 'List of episode information',
    type: [UpdateEpisodeDto],
  })
  @Type(() => UpdateEpisodeDto)
  @ValidateNested({ each: true })
  @Expose()
  episodes: UpdateEpisodeDto[];
}
export class UpdateSeasonDto extends OmitType(SeasonDto, [
  'totalEpisodes',
  'createdAt',
  'updatedAt',
  'episodes',
]) {
  @ApiProperty({
    description: 'List of episode information',
    type: [UpdateEpisodeDto],
  })
  @Type(() => UpdateEpisodeDto)
  @ValidateNested({ each: true })
  @Expose()
  episodes: UpdateEpisodeDto[];
}

export class TVSeriesDto extends BaseEntityDto {
  @ApiProperty({
    description: 'Metadata about the TV series',
    type: ContentDto,
  })
  @ValidateNested()
  @Type(() => ContentDto)
  @Expose()
  metaData: ContentDto;

  @ApiProperty({
    description: 'List of season information',
    type: [SeasonDto],
  })
  @Type(() => SeasonDto)
  @ValidateNested({ each: true })
  @Expose()
  seasons: SeasonDto[];
}
export class CreateTVSeriesDto extends OmitType(TVSeriesDto, [
  'id',
  'createdAt',
  'updatedAt',
  'seasons',
  'metaData',
]) {
  @ApiProperty({
    description: 'List of season information',
    type: [CreateSeasonDto],
  })
  @Type(() => CreateSeasonDto)
  @ValidateNested({ each: true })
  @Expose()
  seasons: CreateSeasonDto[];

  @ApiProperty({
    description: 'Metadata about the TV series',
    type: UpdateContentDto,
  })
  @ValidateNested()
  @Type(() => UpdateContentDto)
  @Expose()
  metaData: UpdateContentDto;
}
export class UpdateTVSeriesDto extends OmitType(TVSeriesDto, [
  'id',
  'createdAt',
  'updatedAt',
  'seasons',
  'metaData',
]) {
  @ApiProperty({
    description: 'List of season information',
    type: [UpdateSeasonDto],
  })
  @Type(() => UpdateSeasonDto)
  @ValidateNested({ each: true })
  @Expose()
  seasons: UpdateSeasonDto[];
  @ApiProperty({
    description: 'Metadata about the TV series',
    type: UpdateContentDto,
  })
  @ValidateNested()
  @Type(() => UpdateContentDto)
  @Expose()
  metaData: UpdateContentDto;
}
