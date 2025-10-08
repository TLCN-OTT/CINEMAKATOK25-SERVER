import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';

import { ContentDto } from './content.dto';
import { EpisodeDto } from './episode.dto';
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
    description: 'List of episode information',
    type: [EpisodeDto],
  })
  @Type(() => EpisodeDto)
  @ValidateNested({ each: true })
  @Expose()
  episodes: EpisodeDto[];
}
export class CreateSeasonDto extends OmitType(SeasonDto, ['id', 'createdAt', 'updatedAt']) {}
export class UpdateSeasonDto extends OmitType(SeasonDto, ['id', 'createdAt', 'updatedAt']) {}

export class TVSeriesDto extends BaseEntityDto {
  @ApiProperty({
    description: 'TV series title',
    example: 'Breaking Bad',
  })
  @IsNotEmpty()
  @Expose()
  title: string;

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
export class CreateTVSeriesDto extends OmitType(TVSeriesDto, ['id', 'createdAt', 'updatedAt']) {}
export class UpdateTVSeriesDto extends OmitType(TVSeriesDto, ['id', 'createdAt', 'updatedAt']) {}
