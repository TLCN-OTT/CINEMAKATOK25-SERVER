import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '@app/common/base/base-entity';
import { USER_STATUS } from '@app/common/enums/global.enum';

@Entity({
  name: 'user',
})
export class EntityUser extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ type: 'enum', enum: USER_STATUS, default: USER_STATUS.ACTIVATED })
  status: USER_STATUS;
}
