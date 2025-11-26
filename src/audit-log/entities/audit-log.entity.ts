// src/audit-log/audit-log.entity.ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';
import { LOG_ACTION } from '@app/common/enums/log.enum';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column()
  userId: string; // ID người thực hiện hành động

  @Column({ type: 'enum', enum: LOG_ACTION })
  action: LOG_ACTION;

  @Column({ nullable: true })
  description: string;
}
