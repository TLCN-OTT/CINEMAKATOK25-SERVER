import { CmsModule } from 'src/cms/cms.module';
import { EntityVideo } from 'src/cms/entities/video.entity';
import { VideoService } from 'src/cms/services/video.service';

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueService } from './queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntityVideo]), // ✅ Import repository cho VideoService
    forwardRef(() => CmsModule), // ✅ Sử dụng forwardRef để tránh circular dependency
  ],
  providers: [QueueService, VideoService], // ✅ Khai báo VideoService với dependencies đầy đủ
  exports: [QueueService],
})
export class QueueModule {}
