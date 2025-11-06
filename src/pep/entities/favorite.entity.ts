import { EntityUser } from 'src/auth/entities/user.entity';
import { EntityContent } from 'src/cms/entities/content.entity';

import { Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';

@Entity({ name: 'favorite' })
export class EntityFavorite extends BaseEntity {
  @ManyToOne(() => EntityUser, user => user.favorites, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: EntityUser;

  @ManyToOne(() => EntityContent, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'content_id' })
  content: EntityContent;
}
