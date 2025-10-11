import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { RESOLUTION } from '@app/common/enums/global.enum';
import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';

export class VideoDto extends BaseEntityDto {
  @ApiProperty({
    description: 'Video title',
    example: 'Sample Video',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  videoUrl: string;

  @ApiProperty({
    description: 'Video resolution',
    example: RESOLUTION.HIGH,
    enum: RESOLUTION,
  })
  @IsNotEmpty()
  @IsEnum(RESOLUTION)
  @Expose()
  resolution: RESOLUTION;
}

export class CreateVideoDto extends OmitType(VideoDto, ['id', 'createdAt', 'updatedAt']) {}
export class UpdateVideoDto extends PickType(VideoDto, ['id', 'videoUrl', 'resolution']) {}
