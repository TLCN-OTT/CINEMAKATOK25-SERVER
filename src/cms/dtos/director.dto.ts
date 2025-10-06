import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { GENDER } from '@app/common/enums/global.enum';
import { ApiProperty, OmitType } from '@nestjs/swagger';

export class DirectorDto extends BaseEntityDto {
  @ApiProperty({
    description: 'Name of the director',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Birth date of the actor',
    example: '1990-01-01',
  })
  @IsNotEmpty()
  @IsDate()
  @Expose()
  birthDate: Date;

  @ApiProperty({
    description: 'Gender of the actor',
    example: GENDER.MALE,
    default: GENDER.MALE,
  })
  @IsNotEmpty()
  @IsEnum(GENDER)
  @Expose()
  gender: GENDER;

  @ApiProperty({
    description: 'Biography of the actor',
    example: 'An accomplished actor known for his versatility.',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  bio: string;

  @ApiProperty({
    description: 'Profile picture of the actor',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  profilePicture: string;

  @ApiProperty({
    description: 'Nationality of the actor',
    example: 'American',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  nationality: string;
}

export class CreateDirectorDto extends OmitType(DirectorDto, ['id', 'createdAt', 'updatedAt']) {}
export class UpdateDirectorDto extends OmitType(DirectorDto, ['id', 'createdAt', 'updatedAt']) {}
