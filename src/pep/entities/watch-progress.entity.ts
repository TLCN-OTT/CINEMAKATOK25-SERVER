import { EntityUser } from 'src/auth/entities/user.entity';
import { EntityContent } from 'src/cms/entities/content.entity';

import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';

@Entity({ name: 'watch_progress' })
@Unique(['user', 'content'])
export class EntityWatchProgress extends BaseEntity {
  @ManyToOne(() => EntityUser, user => user.watchProgress, {
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

  @Column({ type: 'timestamp', nullable: true })
  lastWatched: Date | null;

  @Column({ type: 'int', default: 0 })
  watchedDuration: number; // in seconds

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'uuid', nullable: true })
  episodeId?: string | null; // For TV series - lưu episode hiện tại
}
