import { CmsModule } from 'src/cms/cms.module';
import { EntityContent } from 'src/cms/entities/content.entity';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewController } from './controller/review.controller';
import { WatchListController } from './controller/watchlist.controller';
import { EntityReview } from './entities/review.entity';
import { EntityWatchList } from './entities/watchlist.entity';
import { ReviewService } from './services/review.service';
import { WatchListService } from './services/watchlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([EntityReview, EntityWatchList, EntityContent]), CmsModule],
  controllers: [ReviewController, WatchListController],
  providers: [ReviewService, WatchListService],
  exports: [ReviewService, WatchListService],
})
export class PepModule {}
