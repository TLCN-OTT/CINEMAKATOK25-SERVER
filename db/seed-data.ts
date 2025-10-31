import { ContentType } from 'src/cms/entities/content.entity';

import { MaturityRating } from '@app/common/enums/global.enum';

// ========================= // CATEGORY SEED // =========================
export const categoriesSeed = [
  { categoryName: 'Action' },
  { categoryName: 'Sci-Fi' },
  { categoryName: 'Adventure' },
  { categoryName: 'Crime' },
  { categoryName: 'Drama' },
  { categoryName: 'Animation' },
  { categoryName: 'Comedy' },
  { categoryName: 'Fantasy' },
]; // ========================= // TAG SEED // =========================
export const tagsSeed = [
  { tagName: 'Dream' },
  { tagName: 'Mind' },
  { tagName: 'Space' },
  { tagName: 'Family' },
  { tagName: 'Batman' },
  { tagName: 'Joker' },
  { tagName: 'Marvel' },
  { tagName: 'AI' },
  { tagName: 'Robot' },
  { tagName: 'Time Travel' },
  { tagName: 'Love' },
  { tagName: 'Pixar' },
  { tagName: 'War' },
  { tagName: 'Fantasy World' },
  { tagName: 'Villain' },
  { tagName: 'Superhero' },
]; // ========================= // ACTOR SEED // =========================
export const actorsSeed = [
  {
    name: 'Leonardo DiCaprio',
    bio: 'American actor and film producer.',
    profilePicture: 'https://yourdomain.com/actors/leonardo.png',
    nationality: 'American',
  },
  {
    name: 'Joseph Gordon-Levitt',
    bio: 'American actor and filmmaker.',
    profilePicture: 'https://yourdomain.com/actors/joseph.png',
    nationality: 'American',
  },
  {
    name: 'Matthew McConaughey',
    bio: 'American actor.',
    profilePicture: 'https://yourdomain.com/actors/matthew.png',
    nationality: 'American',
  },
  {
    name: 'Anne Hathaway',
    bio: 'American actress.',
    profilePicture: 'https://yourdomain.com/actors/anne.png',
    nationality: 'American',
  },
  {
    name: 'Christian Bale',
    bio: 'English actor.',
    profilePicture: 'https://yourdomain.com/actors/christian.png',
    nationality: 'English',
  },
  {
    name: 'Heath Ledger',
    bio: 'Australian actor.',
    profilePicture: 'https://yourdomain.com/actors/heath.png',
    nationality: 'Australian',
  },
  {
    name: 'Scarlett Johansson',
    bio: 'American actress and singer.',
    profilePicture: 'https://yourdomain.com/actors/scarlett.png',
    nationality: 'American',
  },
  {
    name: 'Chris Evans',
    bio: 'American actor known for Captain America.',
    profilePicture: 'https://yourdomain.com/actors/evans.png',
    nationality: 'American',
  },
  {
    name: 'Robert Downey Jr.',
    bio: 'American actor and producer.',
    profilePicture: 'https://yourdomain.com/actors/robert.png',
    nationality: 'American',
  },
  {
    name: 'Tom Holland',
    bio: 'English actor best known for Spider-Man.',
    profilePicture: 'https://yourdomain.com/actors/tom.png',
    nationality: 'English',
  },
  {
    name: 'Benedict Cumberbatch',
    bio: 'English actor and producer.',
    profilePicture: 'https://yourdomain.com/actors/benedict.png',
    nationality: 'English',
  },
  {
    name: 'Amy Adams',
    bio: 'American actress.',
    profilePicture: 'https://yourdomain.com/actors/amy.png',
    nationality: 'American',
  },
  {
    name: 'Ryan Reynolds',
    bio: 'Canadian actor and producer.',
    profilePicture: 'https://yourdomain.com/actors/ryan.png',
    nationality: 'Canadian',
  },
]; // ========================= // DIRECTOR SEED // =========================
export const directorsSeed = [
  {
    name: 'Christopher Nolan',
    bio: 'British-American film director, producer, and screenwriter.',
    profilePicture: 'https://yourdomain.com/directors/nolan.png',
    nationality: 'British-American',
  },
  {
    name: 'James Cameron',
    bio: 'Canadian filmmaker and deep-sea explorer.',
    profilePicture: 'https://yourdomain.com/directors/cameron.png',
    nationality: 'Canadian',
  },
  {
    name: 'Steven Spielberg',
    bio: 'American film director and producer.',
    profilePicture: 'https://yourdomain.com/directors/spielberg.png',
    nationality: 'American',
  },
  {
    name: 'Taika Waititi',
    bio: 'New Zealand filmmaker and actor.',
    profilePicture: 'https://yourdomain.com/directors/taika.png',
    nationality: 'New Zealander',
  },
];

function generateMovies(count: number) {
  const movies: Array<{
    duration: number;
    metaData: {
      type: ContentType.MOVIE;
      title: string;
      description: string;
      releaseDate: Date;
      thumbnail: string;
      banner: string;
      trailer: string;
      rating: number;
      maturityRating: MaturityRating;
      viewCount: number;
      categories: typeof categoriesSeed;
      tags: typeof tagsSeed;
      actors: typeof actorsSeed;
      directors: typeof directorsSeed;
    };
  }> = [];
  for (let i = 0; i < count; i++) {
    movies.push({
      duration: 90 + Math.floor(Math.random() * 60), // 90-150 phút
      metaData: {
        type: ContentType.MOVIE,
        title: `Movie ${i + 1}`,
        description: `Description for Movie ${i + 1}. This is a sample movie for testing.`,
        releaseDate: new Date(
          2000 + Math.floor(Math.random() * 25),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ),
        thumbnail: `https://yourdomain.com/thumbnails/movie${i + 1}.png`,
        banner: `https://yourdomain.com/banners/movie${i + 1}.jpg`,
        trailer: `https://yourdomain.com/trailers/movie${i + 1}.mp4`,
        rating: +(6 + Math.random() * 4).toFixed(1), // 6.0 - 10.0
        maturityRating: Object.values(MaturityRating)[
          Math.floor(Math.random() * Object.values(MaturityRating).length)
        ] as MaturityRating,
        viewCount: 10000 + Math.floor(Math.random() * 1000000),
        categories: [categoriesSeed[i % categoriesSeed.length]],
        tags: [tagsSeed[i % tagsSeed.length]],
        actors: [actorsSeed[i % actorsSeed.length]],
        directors: [directorsSeed[i % directorsSeed.length]],
      },
    });
  }
  return movies;
}

// Thêm vào cuối file seed-data.ts
export const moviesSeed = [
  {
    duration: 148,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Inception',
      description: 'A mind-bending thriller about dreams within dreams.',
      releaseDate: new Date('2010-07-16'),
      thumbnail: 'https://yourdomain.com/thumbnails/inception.png',
      banner: 'https://yourdomain.com/banners/inception.jpg',
      trailer: 'https://yourdomain.com/trailers/inception.mp4',
      rating: 8.8,
      maturityRating: MaturityRating.PG13,
      viewCount: 1000000,
      categories: [categoriesSeed[0], categoriesSeed[1]],
      tags: [tagsSeed[0], tagsSeed[1]],
      actors: [actorsSeed[0], actorsSeed[1]],
      directors: [directorsSeed[0]],
    },
  },
  {
    duration: 169,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Interstellar',
      description: 'A journey beyond the stars to save humanity.',
      releaseDate: new Date('2014-11-07'),
      thumbnail: 'https://yourdomain.com/thumbnails/interstellar.png',
      banner: 'https://yourdomain.com/banners/interstellar.jpg',
      trailer: 'https://yourdomain.com/trailers/interstellar.mp4',
      rating: 8.6,
      maturityRating: MaturityRating.PG13,
      viewCount: 900000,
      categories: [categoriesSeed[2], categoriesSeed[1]],
      tags: [tagsSeed[2], tagsSeed[3]],
      actors: [actorsSeed[2], actorsSeed[3]],
      directors: [directorsSeed[0]],
    },
  },
  {
    duration: 152,
    metaData: {
      type: ContentType.MOVIE,
      title: 'The Dark Knight',
      description: 'Batman faces the Joker in Gotham City.',
      releaseDate: new Date('2008-07-18'),
      thumbnail: 'https://yourdomain.com/thumbnails/darkknight.jpg',
      banner: 'https://yourdomain.com/banners/darkknight.jpg',
      trailer: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
      rating: 9.0,
      maturityRating: MaturityRating.PG13,
      viewCount: 1200000,
      categories: [categoriesSeed[0], categoriesSeed[3]],
      tags: [tagsSeed[4], tagsSeed[5]],
      actors: [actorsSeed[4], actorsSeed[5]],
      directors: [directorsSeed[0]],
    },
  },
  {
    duration: 148,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Spider-Man: No Way Home',
      description: 'Spider-Man teams up with other Spider-Men from different universes.',
      releaseDate: new Date('2021-12-17'),
      thumbnail: 'https://yourdomain.com/thumbnails/spiderman.png',
      banner: 'https://yourdomain.com/banners/spiderman.jpg',
      trailer: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
      rating: 8.5,
      maturityRating: MaturityRating.PG13,
      viewCount: 2200000,
      categories: [categoriesSeed[0], categoriesSeed[1]],
      tags: [tagsSeed[6], tagsSeed[15], tagsSeed[9]],
      actors: [actorsSeed[7], actorsSeed[9], actorsSeed[8]],
      directors: [directorsSeed[3]],
    },
  },
  {
    duration: 134,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Black Panther',
      description: "T'Challa returns home as king of Wakanda but faces challenges.",
      releaseDate: new Date('2018-02-16'),
      thumbnail: 'https://yourdomain.com/thumbnails/blackpanther.png',
      banner: 'https://yourdomain.com/banners/blackpanther.jpg',
      trailer: 'https://www.youtube.com/watch?v=xjDjIWPwcPU',
      rating: 7.3,
      maturityRating: MaturityRating.PG13,
      viewCount: 1800000,
      categories: [categoriesSeed[0], categoriesSeed[7]],
      tags: [tagsSeed[6], tagsSeed[15]],
      actors: [actorsSeed[7], actorsSeed[8]],
      directors: [directorsSeed[3]],
    },
  },
  {
    duration: 122,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Joker',
      description: 'An origin story of the infamous villain Joker.',
      releaseDate: new Date('2019-10-04'),
      thumbnail: 'https://yourdomain.com/thumbnails/joker.png',
      banner: 'https://yourdomain.com/banners/joker.jpg',
      trailer: 'https://www.youtube.com/watch?v=zAGVQLHvwOY',
      rating: 8.4,
      maturityRating: MaturityRating.R,
      viewCount: 2000000,
      categories: [categoriesSeed[3], categoriesSeed[4]],
      tags: [tagsSeed[5], tagsSeed[14], tagsSeed[15]],
      actors: [actorsSeed[5], actorsSeed[4]],
      directors: [directorsSeed[0]],
    },
  },
  {
    duration: 130,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Thor: Ragnarok',
      description: 'Thor must escape from Sakaar and save Asgard from Hela.',
      releaseDate: new Date('2017-11-03'),
      thumbnail: 'https://yourdomain.com/thumbnails/thor.png',
      banner: 'https://yourdomain.com/banners/thor.jpg',
      trailer: 'https://www.youtube.com/watch?v=ue80QwXMRHg',
      rating: 7.9,
      maturityRating: MaturityRating.PG13,
      viewCount: 1700000,
      categories: [categoriesSeed[0], categoriesSeed[7]],
      tags: [tagsSeed[6], tagsSeed[15], tagsSeed[13]],
      actors: [actorsSeed[7], actorsSeed[8], actorsSeed[6]],
      directors: [directorsSeed[3]],
    },
  },
  {
    duration: 121,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Guardians of the Galaxy',
      description: 'A group of intergalactic criminals must save the galaxy.',
      releaseDate: new Date('2014-08-01'),
      thumbnail: 'https://yourdomain.com/thumbnails/guardians.png',
      banner: 'https://yourdomain.com/banners/guardians.jpg',
      trailer: 'https://www.youtube.com/watch?v=d96cjJhvlMA',
      rating: 8.0,
      maturityRating: MaturityRating.PG13,
      viewCount: 1900000,
      categories: [categoriesSeed[0], categoriesSeed[2]],
      tags: [tagsSeed[6], tagsSeed[2], tagsSeed[8]],
      actors: [actorsSeed[7], actorsSeed[8], actorsSeed[10]],
      directors: [directorsSeed[3]],
    },
  },
  {
    duration: 118,
    metaData: {
      type: ContentType.MOVIE,
      title: 'The Lion King',
      description:
        'A young lion prince flees his kingdom only to learn the true meaning of responsibility.',
      releaseDate: new Date('1994-06-24'),
      thumbnail: 'https://yourdomain.com/thumbnails/lionking.png',
      banner: 'https://yourdomain.com/banners/lionking.jpg',
      trailer: 'https://www.youtube.com/watch?v=7TavVZMewpY',
      rating: 8.5,
      maturityRating: MaturityRating.G,
      viewCount: 2500000,
      categories: [categoriesSeed[5], categoriesSeed[4]],
      tags: [tagsSeed[3], tagsSeed[11]],
      actors: [actorsSeed[11]],
      directors: [directorsSeed[2]],
    },
  },
  {
    duration: 102,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Frozen',
      description: 'A princess sets out to save her kingdom from eternal winter.',
      releaseDate: new Date('2013-11-27'),
      thumbnail: 'https://yourdomain.com/thumbnails/frozen.png',
      banner: 'https://yourdomain.com/banners/frozen.jpg',
      trailer: 'https://www.youtube.com/watch?v=TbQm5doF_Uc',
      rating: 7.5,
      maturityRating: MaturityRating.G,
      viewCount: 2100000,
      categories: [categoriesSeed[5], categoriesSeed[7]],
      tags: [tagsSeed[11], tagsSeed[10]],
      actors: [actorsSeed[11]],
      directors: [directorsSeed[2]],
    },
  },
  {
    duration: 143,
    metaData: {
      type: ContentType.MOVIE,
      title: 'The Avengers',
      description: "Earth's mightiest heroes must come together to save the world.",
      releaseDate: new Date('2012-05-04'),
      thumbnail: 'https://yourdomain.com/thumbnails/avengers.png',
      banner: 'https://yourdomain.com/banners/avengers.jpg',
      trailer: 'https://www.youtube.com/watch?v=eOrNdBpGMv8',
      rating: 8.0,
      maturityRating: MaturityRating.PG13,
      viewCount: 3000000,
      categories: [categoriesSeed[0], categoriesSeed[1]],
      tags: [tagsSeed[6], tagsSeed[15]],
      actors: [actorsSeed[7], actorsSeed[8], actorsSeed[6]],
      directors: [directorsSeed[1]],
    },
  },
  {
    duration: 107,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Moana',
      description: 'A young girl sets sail to save her island and discover her identity.',
      releaseDate: new Date('2016-11-23'),
      thumbnail: 'https://yourdomain.com/thumbnails/moana.png',
      banner: 'https://yourdomain.com/banners/moana.jpg',
      trailer: 'https://www.youtube.com/watch?v=LKFuXETZUsI',
      rating: 7.6,
      maturityRating: MaturityRating.G,
      viewCount: 1200000,
      categories: [categoriesSeed[5], categoriesSeed[7]],
      tags: [tagsSeed[11], tagsSeed[3]],
      actors: [actorsSeed[11]],
      directors: [directorsSeed[2]],
    },
  },
  {
    duration: 141,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Wonder Woman',
      description: 'Diana, princess of the Amazons, discovers her powers and destiny.',
      releaseDate: new Date('2017-06-02'),
      thumbnail: 'https://yourdomain.com/thumbnails/wonderwoman.png',
      banner: 'https://yourdomain.com/banners/wonderwoman.jpg',
      trailer: 'https://www.youtube.com/watch?v=VSB4wGIdDwo',
      rating: 7.4,
      maturityRating: MaturityRating.PG13,
      viewCount: 1600000,
      categories: [categoriesSeed[0], categoriesSeed[7]],
      tags: [tagsSeed[15], tagsSeed[6]],
      actors: [actorsSeed[7], actorsSeed[8]],
      directors: [directorsSeed[3]],
    },
  },
  ...generateMovies(100),
];
