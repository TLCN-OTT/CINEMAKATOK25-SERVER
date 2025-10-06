import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';

import { ContentType } from '../entities/content.entity';
import { ActorDto } from './actor.dto';
import { CategoryDto } from './category.dto';
import { DirectorDto } from './director.dto';
import { TagDto } from './tag.dto';

export class ContentDto extends BaseEntityDto {
  @ApiProperty({
    description: 'Type of the content',
    example: ContentType.MOVIE,
    enum: ContentType,
  })
  @IsEnum(ContentType)
  @IsNotEmpty()
  @Expose()
  type: ContentType;

  @ApiProperty({
    description: 'Title of the content',
    example: 'Inception',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Description of the content',
    example: 'A mind-bending thriller',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Release date of the content',
    example: '2010-07-16',
  })
  @IsDate()
  @IsNotEmpty()
  @Expose()
  releaseDate: Date;

  @ApiProperty({
    description: 'Thumbnail image URL of the content',
    example: 'https://example.com/thumbnail.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  thumbnail: string;

  @ApiProperty({
    description: 'Banner image URL of the content',
    example: 'https://example.com/banner.jpg',
  })
  @IsString()
  @IsOptional()
  @Expose()
  banner?: string;

  @ApiProperty({
    description: 'Trailer video URL of the content',
    example: 'https://example.com/trailer.mp4',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  trailer: string;

  @ApiProperty({
    description: 'Categories of the content',
    type: [CategoryDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  @Expose()
  categories: CategoryDto[];

  @ApiProperty({
    description: 'Tags of the content',
    type: [TagDto],
  })
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  @Expose()
  tags: TagDto[];

  @ApiProperty({
    description: 'Actors of the content',
    type: [ActorDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ActorDto)
  @Expose()
  actors: ActorDto[];

  @ApiProperty({
    description: 'Directors of the content',
    type: [DirectorDto],
  })
  @ValidateNested({ each: true })
  @Type(() => DirectorDto)
  @Expose()
  directors: DirectorDto[];
}

export class CreateContentDto extends OmitType(ContentDto, ['id', 'createdAt', 'updatedAt']) {}
export class UpdateContentDto extends OmitType(ContentDto, ['id', 'createdAt', 'updatedAt']) {}
