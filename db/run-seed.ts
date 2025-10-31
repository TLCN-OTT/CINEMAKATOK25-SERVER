import { connectionSource } from '../db/seed.config';
import { EntityActor } from '../src/cms/entities/actor.entity';
import { EntityDirector } from '../src/cms/entities/actor.entity';
import { EntityCategory } from '../src/cms/entities/category.entity';
import { EntityContent } from '../src/cms/entities/content.entity';
import { EntityMovie } from '../src/cms/entities/movie.entity';
import { EntityTag } from '../src/cms/entities/tag.entity';
import { actorsSeed, categoriesSeed, directorsSeed, moviesSeed, tagsSeed } from './seed-data';

async function seed() {
  await connectionSource.initialize();

  // Truncate all related tables with CASCADE
  await connectionSource.query(`
    TRUNCATE TABLE 
      "content_category", "content_tag", "content_actor", "content_director",
      "category", "tag", "actor", "director", "content", "movies"
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

  // Seed movies
  const movieRepo = connectionSource.getRepository(EntityMovie);
  const contentRepo = connectionSource.getRepository(EntityContent);
  for (const movie of moviesSeed) {
    // Save metaData (EntityContent)
    const metaData = await contentRepo.save(movie.metaData);
    // Save movie with metaData
    await movieRepo.save({ ...movie, metaData });
  }

  await connectionSource.destroy();
  console.log('✅ Seed data completed!');
}

seed().catch(err => {
  console.error('❌ Seed data failed:', err);
  process.exit(1);
});
