import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';

// Simplified Content DTO for watchlist response
export class WatchListContentDto {
  @ApiProperty({ description: 'Movie ID or TVSeries ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Content ID (metadata)' })
  @Expose()
  contentId: string;

  @ApiProperty({ description: 'Content type (MOVIE or TVSERIES)' })
  @Expose()
  type: string;

  @ApiProperty({ description: 'Content title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Content description' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Content thumbnail URL' })
  @Expose()
  thumbnail: string;

  @ApiProperty({ description: 'Content release date' })
  @Expose()
  releaseDate: Date;

  @ApiProperty({ description: 'Trailer URL' })
  @Expose()
  trailer: string;

  @ApiProperty({ description: 'Maturity Rating' })
  @Expose()
  maturityRating: string;

  @ApiProperty({ description: 'Duration' })
  @Expose()
  duration: string;
}

export class WatchListDto extends BaseEntityDto {
  @ApiProperty({
    description: 'User ID',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Content information',
    type: WatchListContentDto,
  })
  @ValidateNested()
  @Type(() => WatchListContentDto)
  @Expose()
  content: WatchListContentDto;
}

export class CreateWatchListDto {
  @ApiProperty({
    description: 'Content ID to add to watchlist',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  contentId: string;
}

export class RemoveWatchListDto {
  @ApiProperty({
    description: 'Content ID to remove from watchlist',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  contentId: string;
}
