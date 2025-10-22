import { EntityUser } from 'src/auth/entities/user.entity';
import { EntityContent } from 'src/cms/entities/content.entity';

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';

@Entity({ name: 'review' })
export class EntityReview extends BaseEntity {
  // Define properties and methods for the Review entity here
  @Column({ type: 'varchar', length: 500 })
  contentReviewed: string;

  @Column({ type: 'int' })
  rating: number;

  @ManyToOne(() => EntityContent, content => content.reviews, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'content_id' })
  content: EntityContent;

  @ManyToOne(() => EntityUser, user => user.reviews, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: EntityUser;
}
