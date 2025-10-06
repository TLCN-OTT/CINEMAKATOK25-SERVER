import { Column, JoinColumn, OneToMany, OneToOne } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';

import { EntityContent } from './content.entity';
import { EntityVideo } from './video.entity';

export class EntityMovie extends BaseEntity {
  @Column({ type: 'int' })
  duration: number;

  @OneToOne(() => EntityContent, { cascade: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  metaData: EntityContent;

  // Helper method để lấy videos
  async getVideos(videoRepository): Promise<EntityVideo[]> {
    return videoRepository.find({
      where: {
        ownerType: 'movie',
        ownerId: this.id,
      },
    });
  }
}
