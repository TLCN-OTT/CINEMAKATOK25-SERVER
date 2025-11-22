import { EntityEpisode, EntitySeason, EntityTVSeries } from 'src/cms/entities/tvseries.entity';

import { connectionSource } from '../db/seed.config';
import { AuditLog } from '../src/audit-log/entities/audit-log.entity';
import { EntityUser } from '../src/auth/entities/user.entity';
import { EntityActor, EntityDirector } from '../src/cms/entities/actor.entity';
import { EntityCategory } from '../src/cms/entities/category.entity';
import { EntityContent } from '../src/cms/entities/content.entity';
import { EntityMovie } from '../src/cms/entities/movie.entity';
import { EntityTag } from '../src/cms/entities/tag.entity';
import { EntityVideo, VideoOwnerType } from '../src/cms/entities/video.entity';
import {
  actorsSeed,
  categoriesSeed,
  directorsSeed,
  generateAuditLogs,
  moviesSeed,
  tagsSeed,
  tvSeriesSeed,
  usersSeed,
} from './seed-data';

async function seed() {
  await connectionSource.initialize();

  // Truncate all related tables with CASCADE
  await connectionSource.query(`
    TRUNCATE TABLE 
      "content_category", "content_tag", "content_actor", "content_director",
      "category", "tag", "actor", "director", "content", "movies",
      "tvseries", "season", "episode", "video", "audit_logs", "user"
    CASCADE;
  `);

  // Seed categories
  const categoryRepo = connectionSource.getRepository(EntityCategory);
  await categoryRepo.save(categoriesSeed);

  // Seed tags
  const tagRepo = connectionSource.getRepository(EntityTag);
  await tagRepo.save(tagsSeed);

  // Seed actors
  const actorRepo = connectionSource.getRepository(EntityActor);
  await actorRepo.save(actorsSeed);

  // Seed directors
  const directorRepo = connectionSource.getRepository(EntityDirector);
  await directorRepo.save(directorsSeed);

  // Seed users
  console.log('🌱 Seeding users...');
  const userRepo = connectionSource.getRepository(EntityUser);
  const savedUsers = await userRepo.save(usersSeed);
  console.log(`✅ Seeded ${savedUsers.length} users`);

  // Seed movies
  const movieRepo = connectionSource.getRepository(EntityMovie);
  const contentRepo = connectionSource.getRepository(EntityContent);
  const savedMovies: EntityMovie[] = [];
  for (const movie of moviesSeed) {
    // Save metaData (EntityContent)
    const metaData = await contentRepo.save(movie.metaData);
    // Save movie with metaData
    const savedMovie = await movieRepo.save({ ...movie, metaData });
    savedMovies.push(savedMovie);
  }

  // Seed TV series
  const tvSeriesRepo = connectionSource.getRepository(EntityTVSeries);
  const tvSeasonRepo = connectionSource.getRepository(EntitySeason);
  const tvEpisodeRepo = connectionSource.getRepository(EntityEpisode);
  const videoRepo = connectionSource.getRepository(EntityVideo);

  const savedTVSeries: EntityTVSeries[] = [];
  for (const series of tvSeriesSeed) {
    const { metaData, seasons = [], ...seriesPayload } = series;

    const metaDataEntity = await contentRepo.save({ ...metaData });
    const tvSeriesEntity = await tvSeriesRepo.save({
      ...seriesPayload,
      metaData: metaDataEntity,
    });
    savedTVSeries.push(tvSeriesEntity);
    savedTVSeries.push(tvSeriesEntity);

    for (const seasonData of seasons) {
      const { episodes = [], ...seasonPayload } = seasonData;
      const totalEpisodes = seasonPayload.totalEpisodes ?? episodes.length;

      const seasonEntity = await tvSeasonRepo.save({
        ...seasonPayload,
        totalEpisodes,
        tvseries: tvSeriesEntity,
      });

      for (const episodeData of episodes) {
        const { video, ...episodePayload } = episodeData;

        const episodeEntity = await tvEpisodeRepo.save({
          ...episodePayload,
          season: seasonEntity,
        });

        if (video) {
          await videoRepo.save({
            ...video,
            ownerId: episodeEntity.id,
            ownerType: VideoOwnerType.EPISODE,
          });
        }
      }
    }
  }

  // Generate and seed audit logs with real content IDs and user IDs
  console.log('🌱 Generating audit logs...');
  const allContentIds = [
    ...savedMovies.map(m => m.metaData.id),
    ...savedTVSeries.map(s => s.metaData.id),
  ].slice(0, 10); // Take first 10 content IDs for testing

  const allContentTitles = [
    ...savedMovies.map(m => m.metaData.title),
    ...savedTVSeries.map(s => s.metaData.title),
  ].slice(0, 10); // Take first 10 content titles for testing

  const allUserIds = (savedUsers as EntityUser[]).map(u => u.id).filter(id => id !== undefined);

  const auditLogsData = generateAuditLogs(
    allUserIds,
    allContentIds,
    allContentTitles,
    savedMovies.map(m => m.id),
    savedTVSeries.map(s => s.id),
  );
  console.log('🌱 Seeding audit logs...');
  const auditLogRepo = connectionSource.getRepository(AuditLog);
  await auditLogRepo.save(auditLogsData);
  console.log(`✅ Seeded ${auditLogsData.length} audit logs`);

  await connectionSource.destroy();
  console.log('✅ Seed data completed!');
}

seed().catch(err => {
  console.error('❌ Seed data failed:', err);
  process.exit(1);
});
