import { CmsModule } from 'src/cms/cms.module';
import { EntityContent } from 'src/cms/entities/content.entity';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FavoriteController } from './controller/favorite.controller';
import { ReviewController } from './controller/review.controller';
import { WatchListController } from './controller/watchlist.controller';
import { EntityFavorite } from './entities/favorite.entity';
import { EntityReview } from './entities/review.entity';
import { EntityWatchList } from './entities/watchlist.entity';
import { FavoriteService } from './services/favorite.service';
import { ReviewService } from './services/review.service';
import { WatchListService } from './services/watchlist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntityReview, EntityWatchList, EntityContent, EntityFavorite]),
    CmsModule,
  ],
  controllers: [ReviewController, WatchListController, FavoriteController],
  providers: [ReviewService, WatchListService, FavoriteService],
  exports: [ReviewService, WatchListService, FavoriteService],
})
export class PepModule {}
