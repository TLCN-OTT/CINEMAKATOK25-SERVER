import { CoreModule } from '@app/core/core.module';
import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLog } from '../audit-log/entities/audit-log.entity';
import { EntityWatchProgress } from '../pep/entities/watch-progress.entity';
import { ActorController } from './controllers/actor.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { CategoryController } from './controllers/category.controller';
import { ContentController } from './controllers/content.controller';
import { DirectorController } from './controllers/director.controller';
import { MovieController } from './controllers/movie.controller';
import { NewsController } from './controllers/news.controller';
import { RecommendationsController } from './controllers/recommend.controller';
import { TagController } from './controllers/tag.controller';
import { TvSeriesController } from './controllers/tvseries.controller';
import { VideoController } from './controllers/video.controller';
import { EntityActor, EntityDirector } from './entities/actor.entity';
import { EntityCategory } from './entities/category.entity';
import { EntityContent } from './entities/content.entity';
import { EntityMovie } from './entities/movie.entity';
import { EntityNews } from './entities/news.entity';
import { EntityTag } from './entities/tag.entity';
import { EntityEpisode, EntitySeason, EntityTVSeries } from './entities/tvseries.entity';
import { EntityVideo } from './entities/video.entity';
import { ActorService } from './services/actor.service';
import { AnalyticsService } from './services/analytics.service';
import { CategoryService } from './services/category.service';
import { ContentService } from './services/content.service';
import { DirectorService } from './services/director.service';
import { MovieService } from './services/movie.service';
import { NewsService } from './services/news.service';
import { R2StorageService } from './services/r2.service';
import { RecommendService } from './services/recommend.service';
import { S3Service } from './services/s3.service';
import { TagService } from './services/tag.service';
import { TvSeriesService } from './services/tvseries.service';
import { VideoService } from './services/video.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EntityTag,
      EntityContent,
      EntityActor,
      EntityDirector,
      EntityVideo,
      EntityCategory,
      EntityTVSeries,
      EntitySeason,
      EntityEpisode,
      EntityMovie,
      EntityWatchProgress,
      EntityNews,
      AuditLog,
    ]),
    forwardRef(() => CoreModule), // ✅ Sử dụng forwardRef để tránh circular dependency
    HttpModule,
  ],
  controllers: [
    ContentController,
    VideoController,
    DirectorController,
    ActorController,
    TagController,
    CategoryController,
    MovieController,
    TvSeriesController,
    AnalyticsController,
    NewsController,
    RecommendationsController,
  ],
  providers: [
    ContentService,
    VideoService,
    DirectorService,
    ActorService,
    TagService,
    CategoryService,
    MovieService,
    TvSeriesService,
    S3Service,
    R2StorageService,
    AnalyticsService,
    RecommendService,
    NewsService,
  ],
  exports: [
    VideoService,
    MovieService,
    TvSeriesService,
    S3Service,
    R2StorageService,
    ContentService,
  ],
})
export class CmsModule {}
