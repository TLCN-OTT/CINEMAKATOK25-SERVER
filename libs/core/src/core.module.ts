import { Module } from '@nestjs/common';

import { AxiosModule } from './axios/axios.module';
import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [DatabaseModule, CacheModule, AxiosModule.forRoot(), QueueModule],
  exports: [DatabaseModule, CacheModule, QueueModule],
})
export class CoreModule {
  static forRoot() {
    return {
      module: CoreModule,
      global: true,
    };
  }
}
