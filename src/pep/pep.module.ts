import { CmsModule } from 'src/cms/cms.module';
import { EntityContent } from 'src/cms/entities/content.entity';
import { EntityEpisode } from 'src/cms/entities/tvseries.entity';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EpisodeReviewController } from './controller/episode-review.controller';
import { FavoriteController } from './controller/favorite.controller';
import { ReviewController } from './controller/review.controller';
import { WatchProgressController } from './controller/watch-progress.controller';
import { WatchListController } from './controller/watchlist.controller';
import { EntityFavorite } from './entities/favorite.entity';
import { EntityReviewEpisode } from './entities/review-episode.entity';
import { EntityReview } from './entities/review.entity';
import { EntityWatchProgress } from './entities/watch-progress.entity';
import { EntityWatchList } from './entities/watchlist.entity';
import { EpisodeReviewService } from './services/episode-review.service';
import { FavoriteService } from './services/favorite.service';
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
    ]),
    CmsModule,
  ],
  controllers: [
    ReviewController,
    WatchListController,
    FavoriteController,
    WatchProgressController,
    EpisodeReviewController,
  ],
  providers: [
    ReviewService,
    WatchListService,
    FavoriteService,
    WatchProgressService,
    EpisodeReviewService,
  ],
  exports: [
    ReviewService,
    WatchListService,
    FavoriteService,
    WatchProgressService,
    EpisodeReviewService,
  ],
})
export class PepModule {}
