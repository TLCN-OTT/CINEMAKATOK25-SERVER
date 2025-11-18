import { EntityUser } from 'src/auth/entities/user.entity';
import { EntityVideo } from 'src/cms/entities/video.entity';

import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';

@Entity({ name: 'watch_progress' })
@Unique(['user', 'video'])
export class EntityWatchProgress extends BaseEntity {
  @ManyToOne(() => EntityUser, user => user.watchProgress, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: EntityUser;

  @ManyToOne(() => EntityVideo, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'video_id' })
  video: EntityVideo;

  @Column({ type: 'timestamp', nullable: true })
  lastWatched: Date | null;

  @Column({ type: 'int', default: 0 })
  watchedDuration: number; // in seconds

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;
}
