import { EntityUser } from 'src/auth/entities/user.entity';

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';
import { REPORT_REASON, REPORT_STATUS, REPORT_TYPE } from '@app/common/enums/global.enum';

@Entity({ name: 'report' })
export class EntityReport extends BaseEntity {
  @Column({ type: 'enum', enum: REPORT_TYPE })
  type: REPORT_TYPE;

  @Column({ type: 'uuid' })
  targetId: string;

  @Column({ type: 'enum', enum: REPORT_REASON })
  reason: REPORT_REASON;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({ type: 'enum', enum: REPORT_STATUS, default: REPORT_STATUS.PENDING })
  status: REPORT_STATUS;

  @ManyToOne(() => EntityUser, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'reporter_id' })
  reporter: EntityUser;
}
