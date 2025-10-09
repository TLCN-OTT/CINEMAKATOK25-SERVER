import { CoreModule } from '@app/core/core.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContentController } from './controllers/content.controller';
import { VideoController } from './controllers/video.controller';
import { EntityActor, EntityDirector } from './entities/actor.entity';
import { EntityCategory } from './entities/category.entity';
import { EntityContent } from './entities/content.entity';
import { EntityMovie } from './entities/movie.entity';
import { EntityTag } from './entities/tag.entity';
import { EntityEpisode, EntitySeason, EntityTVSeries } from './entities/tvseries.entity';
import { EntityVideo } from './entities/video.entity';
import { ContentService } from './services/content.service';
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
    ]),
    CoreModule,
  ],
  controllers: [ContentController, VideoController],
  providers: [ContentService, VideoService],
})
export class CmsModule {}
