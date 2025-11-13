import { Worker } from 'bullmq';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { AppModule } from 'src/app.module';
import { UpdateVideoDto } from 'src/cms/dtos/video.dto';
import { EntityVideo } from 'src/cms/entities/video.entity';
import { R2StorageService } from 'src/cms/services/r2.service';
import { S3Service } from 'src/cms/services/s3.service';
import { VideoService } from 'src/cms/services/video.service';

import { RESOLUTION, VIDEO_STATUS } from '@app/common/enums/global.enum';
import { getConfig } from '@app/common/utils/get-config';
import { processVideoHLS } from '@app/common/utils/hls/video-hls';
import { NestFactory } from '@nestjs/core';

/**
 * Standalone Worker Process for Video Encoding
 *
 * Run this separately from the main server:
 * node dist/libs/core/src/queue/video-worker.js
 *
 * Or add to package.json:
 * "worker:video": "node dist/libs/core/src/queue/video-worker.js"
 */

export const connection = {
  host: getConfig('redis.host', 'localhost'),
  port: parseInt(getConfig('redis.port', '6379'), 10),
  password: getConfig('redis.password', ''),
};

console.log('🚀 Starting Video Encoding Worker...');
console.log('📡 Redis connection:', connection);

async function bootstrap() {
  console.log('🚀 Starting Video Encoding Worker...');
  console.log('📡 Redis connection:', connection);

  // ✅ Tạo Application Context thay vì HTTP App
  const appContext = await NestFactory.createApplicationContext(AppModule);

  // ✅ Lấy instance của VideoService và S3Service từ DI container
  const videoService = appContext.get(VideoService);
  const s3Service = appContext.get(S3Service);
  const r2Service = appContext.get(R2StorageService);

  // ✅ Worker chạy với DI support
  const worker = new Worker(
    'video-queue',
    async job => {
      const { inputPath, videoId } = job.data;
      console.log(`🎬 [Worker] Start encoding for job ${job.id}`);
      const startTime = Date.now();

      try {
        // Xử lý HLS
        console.log('📹 Processing HLS...');
        const hlsResult = await processVideoHLS(inputPath);
        console.log(`✅ HLS processing completed: ${hlsResult.videoUrl}`);

        // Upload thumbnail FIRST (before HLS files)
        let thumbnailUrl = '';
        if (hlsResult.thumbnailUrl) {
          console.log('📸 Uploading thumbnail to R2...');
          console.log(`   Source: ${hlsResult.thumbnailUrl}`);

          try {
            // ✅ FIX: Ensure R2 bucket name is valid
            // Check your R2Service configuration for bucket name
            thumbnailUrl = await r2Service.uploadImage(
              hlsResult.thumbnailUrl,
              `videos/${videoId}/thumbnails`,
            );
            console.log(`✅ Uploaded thumbnail to R2: ${thumbnailUrl}`);

            // Clean up local thumbnail after successful upload
            await fsPromises.unlink(hlsResult.thumbnailUrl);
            console.log(`🗑️  Deleted local thumbnail: ${hlsResult.thumbnailUrl}`);
          } catch (error) {
            console.error('❌ Failed to upload thumbnail to R2:', error);
            console.error('   Error details:', error.message);
            // Keep local thumbnail as fallback
            thumbnailUrl = hlsResult.thumbnailUrl;
          }
        }

        // Upload HLS files to S3
        console.log('☁️  Uploading HLS files to S3...');
        const hlsDirectory = path.dirname(hlsResult.videoUrl);
        const s3BaseKey = `videos/${videoId}/hls`;

        // Upload master.m3u8
        const masterFile = {
          path: hlsResult.videoUrl,
          originalname: 'master.m3u8',
          mimetype: 'application/vnd.apple.mpegurl',
          size: fs.statSync(hlsResult.videoUrl).size,
        } as Express.Multer.File;

        const masterResult = await s3Service.uploadLargeFile(
          masterFile,
          `${s3BaseKey}/master.m3u8`,
        );
        console.log(`✅ Uploaded master.m3u8 to S3: ${masterResult.url}`);

        // Upload tất cả thư mục stream_0, stream_1, stream_2
        const streamDirs = ['stream_0', 'stream_1', 'stream_2'];

        for (const streamDir of streamDirs) {
          const streamPath = path.join(hlsDirectory, streamDir);

          if (!fs.existsSync(streamPath)) {
            console.warn(`⚠️  Directory not found: ${streamPath}`);
            continue;
          }

          console.log(`📂 Uploading ${streamDir}...`);

          // Đọc tất cả file trong thư mục stream_X
          const files = await fsPromises.readdir(streamPath);

          for (const fileName of files) {
            const filePath = path.join(streamPath, fileName);
            const fileStats = await fsPromises.stat(filePath);

            // Bỏ qua nếu là thư mục
            if (!fileStats.isFile()) continue;

            const file = {
              path: filePath,
              originalname: fileName,
              mimetype: fileName.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T',
              size: fileStats.size,
            } as Express.Multer.File;

            // Upload với đường dẫn đúng: videos/{videoId}/hls/stream_0/data000.ts
            const s3Key = `${s3BaseKey}/${streamDir}/${fileName}`;
            await s3Service.uploadLargeFile(file, s3Key);
            console.log(`✅ Uploaded ${streamDir}/${fileName} to S3`);
          }
        }

        // 4Cleanup - ONLY after all uploads succeed
        console.log('🗑️  Cleaning up local files...');

        // Delete HLS directory
        await fsPromises.rm(hlsDirectory, { recursive: true, force: true });
        console.log('✅ Local HLS files deleted');

        // Delete original input file (moved from earlier)
        if (fs.existsSync(inputPath)) {
          await fsPromises.unlink(inputPath);
          console.log(`🗑️  Deleted original uploaded file: ${inputPath}`);
        }

        // Update video entity
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const updatedVideo = await videoService.update(videoId, {
          id: videoId,
          videoUrl: masterResult.url,
          status: VIDEO_STATUS.READY,
          thumbnailUrl: thumbnailUrl,
        } as UpdateVideoDto);

        console.log(`✅ Updated video ${videoId} successfully in ${duration}s`);
        console.log(`✅ [Worker] Job ${job.id} completed successfully in ${duration}s`);
        console.log(`   Updated video entity: ${updatedVideo.id}`);
        console.log(`   Video URL: ${masterResult.url}`);

        return {
          updatedVideo,
          duration,
          videoId,
          s3Url: masterResult.url,
        };
      } catch (error) {
        console.error(`❌ [Worker] Job ${job.id} failed:`, error);

        // ✅ Mark video as FAILED
        await videoService.update(videoId, {
          id: videoId,
          status: VIDEO_STATUS.FAILED,
          videoUrl: '',
        } as UpdateVideoDto);

        throw error;
      }
    },
    {
      connection,
      concurrency: 4,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  );

  // Logging các event
  worker.on('completed', job => {
    console.log(`\n✅ [Worker] Job ${job.id} for videoId=${job.data.videoId} completed!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`\n❌ [Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', err => {
    console.error('\n💥 [Worker] Worker error:', err);
  });

  console.log('✅ Video Encoding Worker is ready and listening for jobs...');
  console.log('📝 Press Ctrl+C to stop\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down worker gracefully...');
    await worker.close();
    await appContext.close(); // ✅ đóng Nest context
    console.log('👋 Worker stopped');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⏹️  Received SIGTERM, shutting down...');
    await worker.close();
    await appContext.close();
    process.exit(0);
  });
}

bootstrap();
