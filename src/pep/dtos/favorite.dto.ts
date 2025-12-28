import { MovieDto } from 'src/cms/dtos/movies.dto';
import { TVSeriesDto } from 'src/cms/dtos/tvseries.dto';

import { Expose } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { ApiProperty } from '@nestjs/swagger';

export class FavoriteDto extends BaseEntityDto {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  @IsUUID()
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'List of favorite movies',
    type: [MovieDto],
  })
  @ValidateNested({ each: true })
  @Expose()
  movies: MovieDto[];

  @ApiProperty({
    description: 'List of favorite TV series',
    type: [TVSeriesDto],
  })
  @ValidateNested({ each: true })
  @Expose()
  tvSeries: TVSeriesDto[];
}

export class FavoriteContentDto {
  @ApiProperty({ description: 'Total number of favorites for the content', example: 100 })
  @Expose()
  totalFavorites: number;

  @ApiProperty({ description: 'Indicates if the content is favorited by the user', example: true })
  @Expose()
  isFavorited: boolean;
}

export class CreateFavoriteDto {
  @ApiProperty({ description: 'Content ID to be favorited', example: 'uuid' })
  @IsUUID()
  @Expose()
  contentId: string;
}

export class DeleteFavoriteDto {
  @ApiProperty({
    description: 'List of Content IDs to be removed from favorites',
    example: ['uuid1', 'uuid2'],
  })
  @Expose()
  @IsArray()
  contentIds: string[];
}
