import { CmsModule } from 'src/cms/cms.module';
import { EntityVideo } from 'src/cms/entities/video.entity';
import { VideoService } from 'src/cms/services/video.service';

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueService } from './queue.service';

@Module({
  imports: [TypeOrmModule.forFeature([EntityVideo]), forwardRef(() => CmsModule)],
  providers: [QueueService, VideoService],
  exports: [QueueService],
})
export class QueueModule {}
