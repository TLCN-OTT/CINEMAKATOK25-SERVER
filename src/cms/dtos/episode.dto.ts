import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';

import { SeasonDto } from './tvseries.dto';
import { VideoDto } from './video.dto';

export class EpisodeDto extends BaseEntityDto {
  @ApiProperty({
    description: 'Episode number',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  episodeNumber: number;

  @ApiProperty({
    description: 'Episode duration in minutes',
    example: 45,
  })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  episodeDuration: number;

  @ApiProperty({
    description: 'Episode title',
    example: 'Pilot',
  })
  @IsNotEmpty()
  @Expose()
  episodeTitle: string;

  @ApiProperty({
    description: 'Episode thumbnail URL',
    example: 'https://example.com/thumbnail.jpg',
  })
  @IsNotEmpty()
  @Expose()
  episodeThumbnail?: string;

  @ApiProperty({
    description: 'Season information',
    type: SeasonDto,
  })
  @Type(() => SeasonDto)
  @ValidateNested({ each: true })
  @Expose()
  season: SeasonDto;

  @ApiProperty({
    description: 'List of video information',
    type: [VideoDto],
  })
  @Type(() => VideoDto)
  @ValidateNested({ each: true })
  @Expose()
  videos?: VideoDto[];
}
export class CreateEpisodeDto extends OmitType(EpisodeDto, ['id', 'createdAt', 'updatedAt']) {}
export class UpdateEpisodeDto extends OmitType(EpisodeDto, ['id', 'createdAt', 'updatedAt']) {}
