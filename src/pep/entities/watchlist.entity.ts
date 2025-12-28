import { EntityUser } from 'src/auth/entities/user.entity';
import { EntityContent } from 'src/cms/entities/content.entity';

import { Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';

@Entity({ name: 'watchlist' })
export class EntityWatchList extends BaseEntity {
  @ManyToOne(() => EntityUser, user => user.watchlist, {
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
