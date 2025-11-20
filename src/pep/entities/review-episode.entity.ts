import { EntityUser } from 'src/auth/entities/user.entity';
import { EntityContent } from 'src/cms/entities/content.entity';
import { EntityEpisode } from 'src/cms/entities/tvseries.entity';

import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';

export enum REVIEW_STATUS {
  APPROVED = 'APPROVED',
  BANNED = 'BANNED',
}
@Unique(['user', 'episode'])
@Entity({ name: 'review_episode' })
export class EntityReviewEpisode extends BaseEntity {
  // Define properties and methods for the Review entity here
  @Column({ type: 'varchar', length: 500 })
  contentReviewed: string;

  @Column({ type: 'enum', enum: REVIEW_STATUS, default: REVIEW_STATUS.APPROVED })
  status: REVIEW_STATUS;

  @ManyToOne(() => EntityEpisode, episode => episode.reviews, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'episode_id' })
  episode: EntityEpisode;
  @ManyToOne(() => EntityUser, user => user.reviews, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: EntityUser;
}
