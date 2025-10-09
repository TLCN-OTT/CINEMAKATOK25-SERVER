import { CoreModule } from '@app/core/core.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActorController } from './controllers/actor.controller';
import { ContentController } from './controllers/content.controller';
import { DirectorController } from './controllers/director.controller';
import { VideoController } from './controllers/video.controller';
import { EntityActor, EntityDirector } from './entities/actor.entity';
import { EntityCategory } from './entities/category.entity';
import { EntityContent } from './entities/content.entity';
import { EntityMovie } from './entities/movie.entity';
import { EntityTag } from './entities/tag.entity';
import { EntityEpisode, EntitySeason, EntityTVSeries } from './entities/tvseries.entity';
import { EntityVideo } from './entities/video.entity';
import { ActorService } from './services/actor.service';
import { ContentService } from './services/content.service';
import { DirectorService } from './services/director.service';
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
  controllers: [ContentController, VideoController, DirectorController, ActorController],
  providers: [ContentService, VideoService, DirectorService, ActorService],
})
export class CmsModule {}
