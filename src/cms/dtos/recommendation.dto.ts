import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';

import { ContentDto } from './content.dto';

export class RecommendationDto extends BaseEntityDto {
  @ApiProperty({
    description: 'Full content metadata including description, release date, rating, etc.',
    type: ContentDto,
  })
  @Expose()
  @IsOptional()
  metaData: ContentDto | null;
}
