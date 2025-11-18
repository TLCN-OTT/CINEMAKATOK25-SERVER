import { Expose } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

import { BaseEntityDto } from '@app/common/base/base-entity-dto';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { ExcelModule } from '@app/common/utils/excel/excel.module';
import { ApiProperty, OmitType } from '@nestjs/swagger';

export class AuditLogDto extends BaseEntityDto {
  @ApiProperty({
    description: 'ID of the user who performed the action',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Action performed',
    example: LOG_ACTION.CREATE_USER,
  })
  @Expose()
  action: LOG_ACTION;

  @ApiProperty({
    description: 'Description of the action',
    example: 'User created a new account with ID 12345',
  })
  @Expose()
  description: string;
}

export class CreateAuditLogDto extends OmitType(AuditLogDto, [
  'id',
  'createdAt',
  'updatedAt',
] as const) {}

export class AuditLogVideo {
  @ApiProperty({
    description: 'ID of the video',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  videoId: string;
}
