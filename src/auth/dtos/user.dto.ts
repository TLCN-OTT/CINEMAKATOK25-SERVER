import { Expose, plainToInstance } from 'class-transformer';
import { IsBoolean, IsEnum, IsString } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { USER_STATUS } from '@app/common/enums/global.enum';
import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';

import { EntityUser } from '../entities/user.entity';

export class UserDto extends BaseEntityDto {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  @IsString()
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User admin status',
    example: true,
  })
  @IsBoolean()
  @Expose()
  isAdmin: boolean;

  @ApiProperty({
    description: 'User status',
    example: USER_STATUS.ACTIVATED,
    default: USER_STATUS.ACTIVATED,
    enum: USER_STATUS,
  })
  @IsEnum(USER_STATUS)
  @Expose()
  status: USER_STATUS;
}

export class UpdateUserDto extends PickType(UserDto, ['name', 'email', 'isAdmin', 'status']) {}

export class CreateUserDto extends OmitType(UserDto, ['status', 'id', 'createdAt', 'updatedAt']) {}
export function mapToUserDto(entity: EntityUser): UserDto {
  return {
    ...plainToInstance(UserDto, entity, { excludeExtraneousValues: true }),
  };
}
