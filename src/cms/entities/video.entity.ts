import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';
import { RESOLUTION } from '@app/common/enums/global.enum';

export enum VideoOwnerType {
  MOVIE = 'movie',
  EPISODE = 'episode',
}
@Entity({ name: 'video' })
export class EntityVideo extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  videoUrl: string;

  @Column({ type: 'enum', enum: RESOLUTION })
  resolution: RESOLUTION;
  @Column({ type: 'enum', enum: VideoOwnerType, nullable: true })
  ownerType: VideoOwnerType | null;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null;
}
