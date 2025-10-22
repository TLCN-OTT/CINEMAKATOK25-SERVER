import * as config from 'config';

import { CommonModule } from '@app/common/common.module';
import { CoreModule } from '@app/core/index';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { CmsModule } from './cms/cms.module';
import { PepModule } from './pep/pep.module';

@Module({
  imports: [
    //core & common modules
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config.util.toObject],
    }),
    CoreModule.forRoot(),
    CommonModule.forRoot(),
    ScheduleModule.forRoot(),

    //feature module
    AuthModule,
    CmsModule,
    PepModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
