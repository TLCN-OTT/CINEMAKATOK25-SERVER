import { EntityReview } from 'src/pep/entities/review.entity';
import { EntityWatchList } from 'src/pep/entities/watchlist.entity';

import { Column, Entity, OneToMany, Unique } from 'typeorm';

import { USER_STATUS } from '@app/common/enums/global.enum';

import { PersonEntity } from './person.entity';

@Entity({
  name: 'user',
})
@Unique(['provider', 'providerId'])
export class EntityUser extends PersonEntity {
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: USER_STATUS, default: USER_STATUS.ACTIVATED })
  status: USER_STATUS;

  @OneToMany(() => EntityReview, review => review.user)
  reviews: EntityReview[];

  @OneToMany(() => EntityWatchList, watchlist => watchlist.user)
  watchlist: EntityWatchList[];
}
