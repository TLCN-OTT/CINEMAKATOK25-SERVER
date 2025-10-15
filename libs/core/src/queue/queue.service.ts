import { Queue } from 'bullmq';
import { CreateVideoDto, UpdateVideoDto } from 'src/cms/dtos/video.dto';
import { EntityVideo } from 'src/cms/entities/video.entity';
import { VideoService } from 'src/cms/services/video.service';

import { RESOLUTION, VIDEO_STATUS } from '@app/common/enums/global.enum';
import { processVideoHLS } from '@app/common/utils/hls/video-hls';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class QueueService {
  private videoQueue: Queue | null = null;
  private readonly logger = new Logger(QueueService.name);
  private isRedisAvailable = false;

  constructor(private readonly videoService: VideoService) {
    this.initializeQueue();
  }

  private async initializeQueue() {
    try {
      const connection = {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: 1, // ✅ Giảm retry để tránh spam logs
        retryStrategy: () => null, // ✅ Disable auto-retry khi connection failed
      };

      this.videoQueue = new Queue('video-queue', {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });

      const client = await this.videoQueue.client;
      await client.ping();
      this.isRedisAvailable = true;
      this.logger.log('✅ Redis connection established successfully');
      this.logger.log(
        '💡 Run worker separately: pnpm run worker:video (to process jobs independently)',
      );
    } catch (error) {
      this.isRedisAvailable = false;
      this.videoQueue = null; // ✅ Set to null để tránh error khi dùng queue
      this.logger.warn('⚠️  Redis is not available. Queue functionality is disabled.');
      this.logger.warn('💡 To enable queues, please start Redis: docker run -d -p 6379:6379 redis');
      this.logger.warn('📝 Videos will be processed synchronously (slower but functional)');
    }
  }

  async addVideoJob(
    inputPath: string,
    videoId: string,
  ): Promise<{
    isQueued: boolean;
    jobId?: string;
    video?: EntityVideo;
    videoId?: string;
  }> {
    // Nếu không có Redis → xử lý sync
    if (!this.isRedisAvailable || !this.videoQueue) {
      this.logger.warn('⚠️  Redis unavailable, processing video synchronously...');

      try {
        const startTime = Date.now();

        // 1️⃣ Xử lý HLS
        const hlsResults = await processVideoHLS(inputPath);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // 2️⃣ Update các video entities đã tạo với URL thực tế

        const updatedVideo = await this.videoService.update(videoId, {
          id: videoId,
          videoUrl: hlsResults.videoUrl,
          status: VIDEO_STATUS.READY,
        } as UpdateVideoDto);
        this.logger.log(`✅ Synchronously processed video ${videoId} in ${duration}s`);

        return {
          isQueued: false,
          video: updatedVideo,
          videoId: videoId,
        };
      } catch (error) {
        this.logger.error('❌ Sync processing failed:', error);

        // Mark all videos as FAILED
        await this.videoService.update(videoId, {
          id: videoId,
          status: VIDEO_STATUS.FAILED,
          videoUrl: '',
        } as UpdateVideoDto);

        throw error;
      }
    }

    // Có Redis → thêm job vào queue
    try {
      const job = await this.videoQueue.add(
        'process-video',
        {
          inputPath,
          videoId, // ✅ Pass videoId vào job data
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        },
      );

      this.logger.log(`✅ Job ${job.id} added to queue with videoId: ${videoId}`);

      return {
        isQueued: true,
        jobId: job.id as string,
        videoId: videoId,
      };
    } catch (error) {
      this.logger.error('❌ Failed to add job to queue:', error);
      throw error;
    }
  }
}
