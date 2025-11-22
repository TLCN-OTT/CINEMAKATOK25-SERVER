import { ContentType } from 'src/cms/entities/content.entity';

import e from 'express';

import { MaturityRating } from '@app/common/enums/global.enum';
import { GENDER, USER_STATUS } from '@app/common/enums/global.enum';
import { LOG_ACTION } from '@app/common/enums/log.enum';

// ========================= // USER SEED // =========================
export const usersSeed = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: '$2b$10$hashedpassword1', // This should be properly hashed
    dateOfBirth: new Date('1990-01-15'),
    gender: GENDER.MALE,
    isAdmin: false,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/john.png',
    address: '123 Main St, City, Country',
    phoneNumber: '+1234567890',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: '$2b$10$hashedpassword2',
    dateOfBirth: new Date('1988-05-20'),
    gender: GENDER.FEMALE,
    isAdmin: false,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/jane.png',
    address: '456 Oak Ave, City, Country',
    phoneNumber: '+1234567891',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2b$10$hashedpassword3',
    dateOfBirth: new Date('1985-03-10'),
    gender: GENDER.MALE,
    isAdmin: true,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/admin.png',
    address: '789 Admin Blvd, City, Country',
    phoneNumber: '+1234567892',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    password: '$2b$10$hashedpassword4',
    dateOfBirth: new Date('1992-07-25'),
    gender: GENDER.FEMALE,
    isAdmin: false,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/alice.png',
    address: '321 Pine St, City, Country',
    phoneNumber: '+1234567893',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  {
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    password: '$2b$10$hashedpassword5',
    dateOfBirth: new Date('1987-11-30'),
    gender: GENDER.MALE,
    isAdmin: false,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/bob.png',
    address: '654 Elm Dr, City, Country',
    phoneNumber: '+1234567894',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  {
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    password: '$2b$10$hashedpassword6',
    dateOfBirth: new Date('1995-09-12'),
    gender: GENDER.MALE,
    isAdmin: false,
    isEmailVerified: false,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/charlie.png',
    address: '987 Maple Ln, City, Country',
    phoneNumber: '+1234567895',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  {
    name: 'Diana Prince',
    email: 'diana.prince@example.com',
    password: '$2b$10$hashedpassword7',
    dateOfBirth: new Date('1991-04-18'),
    gender: GENDER.FEMALE,
    isAdmin: false,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/diana.png',
    address: '147 Wonder Way, City, Country',
    phoneNumber: '+1234567896',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  {
    name: 'Edward Norton',
    email: 'edward.norton@example.com',
    password: '$2b$10$hashedpassword8',
    dateOfBirth: new Date('1989-12-05'),
    gender: GENDER.MALE,
    isAdmin: false,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/edward.png',
    address: '258 Fight Club St, City, Country',
    phoneNumber: '+1234567897',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  {
    name: 'Fiona Green',
    email: 'fiona.green@example.com',
    password: '$2b$10$hashedpassword9',
    dateOfBirth: new Date('1993-08-22'),
    gender: GENDER.FEMALE,
    isAdmin: false,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/fiona.png',
    address: '369 Green Valley, City, Country',
    phoneNumber: '+1234567898',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  {
    name: 'George Lucas',
    email: 'george.lucas@example.com',
    password: '$2b$10$hashedpassword10',
    dateOfBirth: new Date('1986-06-14'),
    gender: GENDER.MALE,
    isAdmin: false,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/george.png',
    address: '741 Star Wars Blvd, City, Country',
    phoneNumber: '+1234567899',
    status: USER_STATUS.ACTIVATED,
    isBanned: false,
  },
  // Banned user
  {
    name: 'Banned User',
    email: 'banned@example.com',
    password: '$2b$10$hashedpassword11',
    dateOfBirth: new Date('1994-02-28'),
    gender: GENDER.MALE,
    isAdmin: false,
    isEmailVerified: true,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/banned.png',
    address: '999 Banned St, City, Country',
    phoneNumber: '+1234567800',
    status: USER_STATUS.ACTIVATED,
    isBanned: true,
    banReason: 'Violation of terms of service',
    bannedUntil: new Date('2025-12-31'),
  },
  // Inactive user
  {
    name: 'Inactive User',
    email: 'inactive@example.com',
    password: '$2b$10$hashedpassword12',
    dateOfBirth: new Date('1984-10-08'),
    gender: GENDER.FEMALE,
    isAdmin: false,
    isEmailVerified: false,
    provider: undefined,
    providerId: undefined,
    avatar: 'https://yourdomain.com/avatars/inactive.png',
    address: '000 Inactive Ave, City, Country',
    phoneNumber: '+1234567801',
    status: USER_STATUS.DEACTIVATED,
    isBanned: false,
  },
];

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

function generateTVSeries(count: number) {
  const series: Array<{
    duration: number;
    metaData: {
      type: ContentType.TVSERIES;
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
    seasons: Array<{
      seasonNumber: number;
      totalEpisodes: number;
      episodes: Array<{
        episodeNumber: number;
        episodeDuration: number;
        episodeTitle: string;
        video: {
          videoUrl: string;
          duration: number;
        };
      }>;
    }>;
  }> = [];
  for (let i = 0; i < count; i++) {
    series.push({
      duration: 40 + Math.floor(Math.random() * 20),
      metaData: {
        type: ContentType.TVSERIES,
        title: `TV Series ${i + 1}`,
        description: `Description for TV Series ${i + 1}. Auto-generated for testing.`,
        releaseDate: new Date(
          2000 + Math.floor(Math.random() * 25),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ),
        thumbnail: `https://yourdomain.com/thumbnails/tvseries${i + 1}.png`,
        banner: `https://yourdomain.com/banners/tvseries${i + 1}.jpg`,
        trailer: `https://yourdomain.com/trailers/tvseries${i + 1}.mp4`,
        rating: +(6 + Math.random() * 3.5).toFixed(1),
        maturityRating: Object.values(MaturityRating)[
          Math.floor(Math.random() * Object.values(MaturityRating).length)
        ] as MaturityRating,
        viewCount: 500000 + Math.floor(Math.random() * 1500000),
        categories: [categoriesSeed[i % categoriesSeed.length]],
        tags: [tagsSeed[i % tagsSeed.length]],
        actors: [actorsSeed[i % actorsSeed.length]],
        directors: [directorsSeed[i % directorsSeed.length]],
      },
      seasons: [
        {
          seasonNumber: 1,
          totalEpisodes: 2,
          episodes: [
            {
              episodeNumber: 1,
              episodeDuration: 20 + Math.floor(Math.random() * 20),
              episodeTitle: `Episode 1 of TV Series ${i + 1}`,
              video: {
                videoUrl: `https://yourdomain.com/tvseries${i + 1}/s1e1.mp4`,
                duration: 20 + Math.floor(Math.random() * 20),
              },
            },
            {
              episodeNumber: 2,
              episodeDuration: 20 + Math.floor(Math.random() * 20),
              episodeTitle: `Episode 2 of TV Series ${i + 1}`,
              video: {
                videoUrl: `https://yourdomain.com/tvseries${i + 1}/s1e2.mp4`,
                duration: 20 + Math.floor(Math.random() * 20),
              },
            },
          ],
        },
      ],
    });
  }
  return series;
}

export const tvSeriesSeed = [...generateTVSeries(60)];

// ========================= // AUDIT LOG SEED // =========================
export function generateAuditLogs(
  userIds: string[] = [],
  contentIds: string[] = [],
  contentTitles: string[] = [],
  savedMovies: string[] = [],
  savedTVSeries: string[] = [],
) {
  const logs: Array<{
    userId: string;
    action: LOG_ACTION;
    description: string;
    createdAt: Date;
  }> = [];
  const now = new Date();

  // Use provided user IDs or fallback to sample IDs
  const sampleUserIds =
    userIds.length > 0
      ? userIds
      : [
          'user-1',
          'user-2',
          'user-3',
          'user-4',
          'user-5',
          'user-6',
          'user-7',
          'user-8',
          'user-9',
          'user-10',
          'user-11',
          'user-12',
          'user-13',
          'user-14',
          'user-15',
        ];

  // Use provided content IDs or fallback to sample IDs
  const sampleContentIds =
    contentIds.length > 0
      ? contentIds
      : [
          'content-1',
          'content-2',
          'content-3',
          'content-4',
          'content-5',
          'content-6',
          'content-7',
          'content-8',
          'content-9',
          'content-10',
        ];

  const sampleTitles =
    contentTitles.length > 0
      ? contentTitles
      : [
          'Trending Up Movie',
          'Trending Down Movie',
          'Stable Movie',
          'New Movie',
          'Popular Movie 1',
          'Popular Movie 2',
          'Popular Movie 3',
          'Popular Movie 4',
          'Popular Movie 5',
          'Popular Movie 6',
        ];

  // 1. CONTENT_VIEW_INCREASED logs for trending analysis
  // Content 1: Trending up (50 views tuần này, 30 views tuần trước)
  // Previous period (8-14 days ago): 30 views
  for (let i = 0; i < 30; i++) {
    const randomDay = 8 + Math.floor(Math.random() * 7); // 8-14 days ago
    logs.push({
      userId: 'System',
      action: LOG_ACTION.CONTENT_VIEW_INCREASED,
      description: `View count increased for content: Trending Up Movie (ID: ${sampleContentIds[0]})`,
      createdAt: new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000),
    });
  }
  // Recent period (0-7 days ago): 50 views
  for (let i = 0; i < 50; i++) {
    const randomDay = Math.floor(Math.random() * 7); // 0-6 days ago
    logs.push({
      userId: 'System',
      action: LOG_ACTION.CONTENT_VIEW_INCREASED,
      description: `View count increased for content: Trending Up Movie (ID: ${sampleContentIds[0]})`,
      createdAt: new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000),
    });
  }

  // Content 2: Trending down (20 views tuần này, 40 views tuần trước) - sẽ có change âm
  // Previous period (8-14 days ago): 40 views
  for (let i = 0; i < 40; i++) {
    const randomDay = 8 + Math.floor(Math.random() * 7); // 8-14 days ago
    logs.push({
      userId: 'System',
      action: LOG_ACTION.CONTENT_VIEW_INCREASED,
      description: `View count increased for content: Trending Down Movie (ID: ${sampleContentIds[1]})`,
      createdAt: new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000),
    });
  }
  // Recent period (0-7 days ago): 20 views
  for (let i = 0; i < 20; i++) {
    const randomDay = Math.floor(Math.random() * 7); // 0-6 days ago
    logs.push({
      userId: 'System',
      action: LOG_ACTION.CONTENT_VIEW_INCREASED,
      description: `View count increased for content: Trending Down Movie (ID: ${sampleContentIds[1]})`,
      createdAt: new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000),
    });
  }

  // Content 3: Stable (35 views both weeks) - change ≈ 0%
  // Previous period (8-14 days ago): 35 views
  for (let i = 0; i < 35; i++) {
    const randomDay = 8 + Math.floor(Math.random() * 7); // 8-14 days ago
    logs.push({
      userId: 'System',
      action: LOG_ACTION.CONTENT_VIEW_INCREASED,
      description: `View count increased for content: Stable Movie (ID: ${sampleContentIds[2]})`,
      createdAt: new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000),
    });
  }
  // Recent period (0-7 days ago): 35 views
  for (let i = 0; i < 35; i++) {
    const randomDay = Math.floor(Math.random() * 7); // 0-6 days ago
    logs.push({
      userId: 'System',
      action: LOG_ACTION.CONTENT_VIEW_INCREASED,
      description: `View count increased for content: Stable Movie (ID: ${sampleContentIds[2]})`,
      createdAt: new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000),
    });
  }

  // Content 4: New content (25 views tuần này, 0 views tuần trước) - change = 0%
  // Only recent period (0-7 days ago): 25 views
  for (let i = 0; i < 25; i++) {
    const randomDay = Math.floor(Math.random() * 7); // 0-6 days ago
    logs.push({
      userId: 'System',
      action: LOG_ACTION.CONTENT_VIEW_INCREASED,
      description: `View count increased for content: New Movie (ID: ${sampleContentIds[3]})`,
      createdAt: new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000),
    });
  }

  // Content 5: High trending (80 views tuần này, 20 views tuần trước)
  // Previous period (8-14 days ago): 20 views
  for (let i = 0; i < 20; i++) {
    const randomDay = 8 + Math.floor(Math.random() * 7); // 8-14 days ago
    logs.push({
      userId: 'System',
      action: LOG_ACTION.CONTENT_VIEW_INCREASED,
      description: `View count increased for content: High Trending Movie (ID: ${sampleContentIds[4]})`,
      createdAt: new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000),
    });
  }
  // Recent period (0-7 days ago): 80 views
  for (let i = 0; i < 80; i++) {
    const randomDay = Math.floor(Math.random() * 7); // 0-6 days ago
    logs.push({
      userId: 'System',
      action: LOG_ACTION.CONTENT_VIEW_INCREASED,
      description: `View count increased for content: High Trending Movie (ID: ${sampleContentIds[4]})`,
      createdAt: new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000),
    });
  }

  // 3. User registration data (30 days)
  for (let i = 0; i < sampleUserIds.length; i++) {
    logs.push({
      userId: sampleUserIds[i],
      action: LOG_ACTION.USER_REGISTRATION,
      description: `User registration for ${sampleUserIds[i]}`,
      createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000), // 0-12 days ago (one per user)
    });
  }

  // 4. Churn analysis - users who haven't logged in for 30+ days
  for (let i = 0; i < sampleUserIds.length; i++) {
    const lastLogin = new Date(now.getTime() - (35 + Math.random() * 60) * 24 * 60 * 60 * 1000); // 35-95 days ago
    logs.push({
      userId: sampleUserIds[i],
      action: LOG_ACTION.USER_LOGIN,
      description: `Last login for user ${sampleUserIds[i]}`,
      createdAt: lastLogin,
    });
  }

  // 5. Series engagement
  // 5. Series engagement
  const seriesActions = [
    LOG_ACTION.LIKE_SERIES,
    LOG_ACTION.PLAY_EPISODE_OF_SERIES,
    LOG_ACTION.ADD_SERIES_TO_WATCHLIST,
    LOG_ACTION.CREATE_REVIEW,
  ];

  for (let i = 0; i < 100; i++) {
    const userId = sampleUserIds[i % sampleUserIds.length];
    const action = seriesActions[Math.floor(Math.random() * seriesActions.length)];
    const typeText = 'TV series'; // Loại content
    const contentId = savedTVSeries[Math.floor(Math.random() * savedTVSeries.length)];

    let description = '';
    switch (action) {
      case LOG_ACTION.LIKE_SERIES:
        description = `User ${userId} liked ${typeText} with ID ${contentId}`;
        break;
      case LOG_ACTION.PLAY_EPISODE_OF_SERIES:
        description = `User ${userId} played series with ID ${contentId}`;
        break;
      case LOG_ACTION.ADD_SERIES_TO_WATCHLIST:
        description = `User ${userId} added ${typeText} with ID ${contentId}`;
        break;
      case LOG_ACTION.CREATE_REVIEW:
        description = `User ${userId} created review on ${typeText} with ID ${contentId}`;
        break;
      default:
        description = `User ${userId} did ${action} on ${typeText} with ID ${contentId}`;
    }

    logs.push({
      userId,
      action,
      description,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }

  // 2. User engagement actions for DAU/MAU/Churn analysis
  const engagementActions = [
    LOG_ACTION.USER_LOGIN,
    LOG_ACTION.LIKE_MOVIE,
    LOG_ACTION.PLAY_MOVIE,
    LOG_ACTION.ADD_MOVIE_TO_WATCHLIST,
    LOG_ACTION.CREATE_REVIEW,
  ];

  // Generate DAU data for last 7 days (decreasing pattern)
  const dauCounts = [120, 115, 110, 105, 100, 95, 90]; // Today to 6 days ago
  for (let day = 0; day < 7; day++) {
    const dayUsers = dauCounts[day];
    for (let i = 0; i < dayUsers; i++) {
      const userId = sampleUserIds[i % sampleUserIds.length];
      const action = engagementActions[Math.floor(Math.random() * engagementActions.length)];
      const typeText = action.includes('MOVIE') ? 'movie' : 'user';
      const contentId = savedMovies[Math.floor(Math.random() * savedMovies.length)];

      let description = '';
      switch (action) {
        case LOG_ACTION.USER_LOGIN:
          description = `User ${userId} logged in`;
          break;
        case LOG_ACTION.LIKE_MOVIE:
          description = `User ${userId} liked ${typeText} with ID ${contentId}`;
          break;
        case LOG_ACTION.PLAY_MOVIE:
          description = `User ${userId} played ${typeText} with ID ${contentId}`;
          break;
        case LOG_ACTION.ADD_MOVIE_TO_WATCHLIST:
          description = `User ${userId} added ${typeText} with ID ${contentId}`;
          break;
        case LOG_ACTION.CREATE_REVIEW:
          description = `User ${userId} created review on movie with ID ${contentId}`;
          break;
        default:
          description = `User ${userId} did ${action} on ${typeText} with ID ${contentId}`;
      }

      logs.push({
        userId,
        action,
        description,
        createdAt: new Date(
          now.getTime() - day * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000,
        ),
      });
    }
  }

  // Generate MAU data for last 4 months (increasing pattern)
  const mauCounts = [800, 850, 900, 950]; // Current month to 3 months ago
  for (let month = 0; month < 4; month++) {
    const monthUsers = mauCounts[month];
    const monthStart = new Date(now.getFullYear(), now.getMonth() - month, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - month + 1, 1);

    for (let i = 0; i < monthUsers; i++) {
      const userId = sampleUserIds[i % sampleUserIds.length];
      const action = engagementActions[Math.floor(Math.random() * engagementActions.length)];
      const typeText = action.includes('MOVIE') ? 'movie' : 'user';
      const contentId = savedMovies[Math.floor(Math.random() * savedMovies.length)];
      const randomTime =
        monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime());

      let description = '';
      switch (action) {
        case LOG_ACTION.USER_LOGIN:
          description = `User ${userId} logged in`;
          break;
        case LOG_ACTION.LIKE_MOVIE:
          description = `User ${userId} liked ${typeText} with ID ${contentId}`;
          break;
        case LOG_ACTION.PLAY_MOVIE:
          description = `User ${userId} played ${typeText} with ID ${contentId}`;
          break;
        case LOG_ACTION.ADD_MOVIE_TO_WATCHLIST:
          description = `User ${userId} added ${typeText} with ID ${contentId}`;
          break;
        case LOG_ACTION.CREATE_REVIEW:
          description = `User ${userId} created review on ${typeText} with ID ${contentId}`;
          break;
        default:
          description = `User ${userId} did ${action} on ${typeText} with ID ${contentId}`;
      }

      logs.push({
        userId,
        action,
        description,
        createdAt: new Date(randomTime),
      });
    }
  }

  return logs;
}
