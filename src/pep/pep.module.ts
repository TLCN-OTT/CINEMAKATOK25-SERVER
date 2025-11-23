import { AuthModule } from 'src/auth/auth.module';
import { CmsModule } from 'src/cms/cms.module';
import { EntityContent } from 'src/cms/entities/content.entity';
import { EntityEpisode } from 'src/cms/entities/tvseries.entity';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EpisodeReviewController } from './controller/episode-review.controller';
import { FavoriteController } from './controller/favorite.controller';
import { ReportController } from './controller/report.controller';
import { ReviewController } from './controller/review.controller';
import { WatchProgressController } from './controller/watch-progress.controller';
import { WatchListController } from './controller/watchlist.controller';
import { EntityFavorite } from './entities/favorite.entity';
import { EntityReport } from './entities/report.entity';
import { EntityReviewEpisode } from './entities/review-episode.entity';
import { EntityReview } from './entities/review.entity';
import { EntityWatchProgress } from './entities/watch-progress.entity';
import { EntityWatchList } from './entities/watchlist.entity';
import { EpisodeReviewService } from './services/episode-review.service';
import { FavoriteService } from './services/favorite.service';
import { ReportService } from './services/report.service';
import { ReviewService } from './services/review.service';
import { WatchProgressService } from './services/watch-progress.service';
import { WatchListService } from './services/watchlist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EntityReview,
      EntityWatchList,
      EntityContent,
      EntityFavorite,
      EntityWatchProgress,
      EntityReviewEpisode,
      EntityEpisode,
      EntityReport,
    ]),
    CmsModule,
    AuthModule,
  ],
  controllers: [
    ReviewController,
    WatchListController,
    FavoriteController,
    WatchProgressController,
    EpisodeReviewController,
    ReportController,
  ],
  providers: [
    ReviewService,
    WatchListService,
    FavoriteService,
    WatchProgressService,
    EpisodeReviewService,
    ReportService,
  ],
  exports: [
    ReviewService,
    WatchListService,
    FavoriteService,
    WatchProgressService,
    EpisodeReviewService,
    ReportService,
  ],
})
export class PepModule {}
