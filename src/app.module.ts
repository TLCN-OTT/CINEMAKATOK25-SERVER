import * as config from 'config';

import { CommonModule } from '@app/common/common.module';
import { CoreModule } from '@app/core/index';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
