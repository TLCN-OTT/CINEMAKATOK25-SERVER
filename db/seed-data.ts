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
    profilePicture:
      'https://media.rolex.com/image/upload/q_auto:eco/f_auto/c_limit,w_1920/v1740135245/rolexcom/rolex-testimonees/arts/cinema/leonard-dicaprio/rolex-testimonees-cinema-leonardo-dicaprio-lifestyle-gettyimages-530778376.jpg',
    nationality: 'American',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1974-11-11'),
  },
  {
    name: 'Joseph Gordon-Levitt',
    bio: 'American actor and filmmaker.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Joseph_Gordon-Levitt_by_Gage_Skidmore_2.jpg/960px-Joseph_Gordon-Levitt_by_Gage_Skidmore_2.jpg',
    nationality: 'American',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1981-02-17'),
  },
  {
    name: 'Matthew McConaughey',
    bio: 'American actor.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Matthew_McConaughey_-_Goldene_Kamera_2014_-_Berlin.jpg/960px-Matthew_McConaughey_-_Goldene_Kamera_2014_-_Berlin.jpg',
    nationality: 'American',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1969-11-04'),
  },
  {
    name: 'Anne Hathaway',
    bio: 'American actress.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Anne_Hathaway_at_The_Apprentice_in_NYC_03_%28cropped2%29.jpg/960px-Anne_Hathaway_at_The_Apprentice_in_NYC_03_%28cropped2%29.jpg',
    nationality: 'American',
    gender: GENDER.FEMALE,
    dateOfBirth: new Date('1982-11-12'),
  },
  {
    name: 'Christian Bale',
    bio: 'English actor.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Christian_Bale_in_2022.jpg/960px-Christian_Bale_in_2022.jpg',
    nationality: 'English',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1974-01-30'),
  },
  {
    name: 'Heath Ledger',
    bio: 'Australian actor.',
    profilePicture: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Heath_Ledger.jpg',
    nationality: 'Australian',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1979-04-04'),
  },
  {
    name: 'Scarlett Johansson',
    bio: 'American actress and singer.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Scarlett_Johansson-8588.jpg/960px-Scarlett_Johansson-8588.jpg',
    nationality: 'American',
    gender: GENDER.FEMALE,
    dateOfBirth: new Date('1984-11-22'),
  },
  {
    name: 'Chris Evans',
    bio: 'American actor known for Captain America.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Chris_Evans_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg/960px-Chris_Evans_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg',
    nationality: 'American',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1981-06-13'),
  },
  {
    name: 'Robert Downey Jr.',
    bio: 'American actor and producer.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Robert_Downey_Jr._2014_Comic-Con.jpg/960px-Robert_Downey_Jr._2014_Comic-Con.jpg',
    nationality: 'American',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1965-04-04'),
  },
  {
    name: 'Tom Holland',
    bio: 'English actor best known for Spider-Man.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Tom_Holland_during_pro-am_Wentworth_golf_club_2023-2.jpg/960px-Tom_Holland_during_pro-am_Wentworth_golf_club_2023-2.jpg',
    nationality: 'English',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1996-06-01'),
  },
  {
    name: 'Benedict Cumberbatch',
    bio: 'English actor and producer.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Benedict_Cumberbatch-67555.jpg/960px-Benedict_Cumberbatch-67555.jpg',
    nationality: 'English',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1976-07-19'),
  },
  {
    name: 'Amy Adams',
    bio: 'American actress.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Amy_Adams_at_the_2024_Toronto_International_Film_Festival._03_%28cropped%29.jpg/960px-Amy_Adams_at_the_2024_Toronto_International_Film_Festival._03_%28cropped%29.jpg',
    nationality: 'American',
    gender: GENDER.FEMALE,
    dateOfBirth: new Date('1974-08-20'),
  },
  {
    name: 'Ryan Reynolds',
    bio: 'Canadian actor and producer.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Ryan_Reynolds_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg/960px-Ryan_Reynolds_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg',
    nationality: 'Canadian',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1976-10-23'),
  },
]; // ========================= // DIRECTOR SEED // =========================
export const directorsSeed = [
  {
    name: 'Christopher Nolan',
    bio: 'British-American film director, producer, and screenwriter.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/4/49/ChrisNolanBFI150224_%2810_of_12%29_%2853532289710%29_%28cropped2%29.jpg',
    nationality: 'British-American',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1970-07-30'),
  },
  {
    name: 'James Cameron',
    bio: 'Canadian filmmaker and deep-sea explorer.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Avatar_The_Way_of_Water_Tokyo_Press_Conference_James_Cameron_%2852563430565%29_%28cropped%29.jpg/960px-Avatar_The_Way_of_Water_Tokyo_Press_Conference_James_Cameron_%2852563430565%29_%28cropped%29.jpg',
    nationality: 'Canadian',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1954-08-16'),
  },
  {
    name: 'Steven Spielberg',
    bio: 'American film director and producer.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/MKr25402_Steven_Spielberg_%28Berlinale_2023%29_%283x4_cropped%29.jpg/960px-MKr25402_Steven_Spielberg_%28Berlinale_2023%29_%283x4_cropped%29.jpg',
    nationality: 'American',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1946-12-18'),
  },
  {
    name: 'Taika Waititi',
    bio: 'New Zealand filmmaker and actor.',
    profilePicture:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Taika_Waititi_photo_by_pouria_afkhami.jpg/960px-Taika_Waititi_photo_by_pouria_afkhami.jpg',
    nationality: 'New Zealander',
    gender: GENDER.MALE,
    dateOfBirth: new Date('1975-08-16'),
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
    video: {
      videoUrl: string;
      duration: number;
    };
  }> = [];
  for (let i = 0; i < count; i++) {
    const duration = 90 + Math.floor(Math.random() * 60); // 90-150 phút
    movies.push({
      duration,
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
      video: {
        videoUrl:
          'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
        duration,
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
      thumbnail:
        'https://www.cgv.vn/media/catalog/product/cache/3/image/c5f0a1eff4c394a251036189ccddaacd/i/n/inception.jpg',
      banner:
        'https://www.cgv.vn/media/catalog/product/cache/3/image/c5f0a1eff4c394a251036189ccddaacd/i/n/inception.jpg',
      trailer: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
      rating: 8.8,
      maturityRating: MaturityRating.PG13,
      viewCount: 1000000,
      categories: [categoriesSeed[0], categoriesSeed[1]],
      tags: [tagsSeed[0], tagsSeed[1]],
      actors: [actorsSeed[0], actorsSeed[1]],
      directors: [directorsSeed[0]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 148,
    },
  },
  {
    duration: 169,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Interstellar',
      description: 'A journey beyond the stars to save humanity.',
      releaseDate: new Date('2014-11-07'),
      thumbnail:
        'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
      banner:
        'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
      trailer: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      rating: 8.6,
      maturityRating: MaturityRating.PG13,
      viewCount: 900000,
      categories: [categoriesSeed[2], categoriesSeed[1]],
      tags: [tagsSeed[2], tagsSeed[3]],
      actors: [actorsSeed[2], actorsSeed[3]],
      directors: [directorsSeed[0]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 169,
    },
  },
  {
    duration: 152,
    metaData: {
      type: ContentType.MOVIE,
      title: 'The Dark Knight',
      description: 'Batman faces the Joker in Gotham City.',
      releaseDate: new Date('2008-07-18'),
      thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/91HM6470jLL.jpg',
      banner: 'https://images-na.ssl-images-amazon.com/images/I/91HM6470jLL.jpg',
      trailer: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
      rating: 9.0,
      maturityRating: MaturityRating.PG13,
      viewCount: 1200000,
      categories: [categoriesSeed[0], categoriesSeed[3]],
      tags: [tagsSeed[4], tagsSeed[5]],
      actors: [actorsSeed[4], actorsSeed[5]],
      directors: [directorsSeed[0]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 152,
    },
  },
  {
    duration: 148,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Spider-Man: No Way Home',
      description: 'Spider-Man teams up with other Spider-Men from different universes.',
      releaseDate: new Date('2021-12-17'),
      thumbnail:
        'https://resizing.flixster.com/8PNiwC2bpe9OecfYZSOVkvYC5vk=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2U5NGM0Y2Q1LTAyYTItNGFjNC1hNWZhLWMzYjJjOTdjMTFhOS5qcGc=',
      banner:
        'https://resizing.flixster.com/8PNiwC2bpe9OecfYZSOVkvYC5vk=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2U5NGM0Y2Q1LTAyYTItNGFjNC1hNWZhLWMzYjJjOTdjMTFhOS5qcGc=',
      trailer: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
      rating: 8.5,
      maturityRating: MaturityRating.PG13,
      viewCount: 2200000,
      categories: [categoriesSeed[0], categoriesSeed[1]],
      tags: [tagsSeed[6], tagsSeed[15], tagsSeed[9]],
      actors: [actorsSeed[7], actorsSeed[9], actorsSeed[8]],
      directors: [directorsSeed[3]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 148,
    },
  },
  {
    duration: 134,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Black Panther',
      description: "T'Challa returns home as king of Wakanda but faces challenges.",
      releaseDate: new Date('2018-02-16'),
      thumbnail:
        'https://m.media-amazon.com/images/M/MV5BMTg1MTY2MjYzNV5BMl5BanBnXkFtZTgwMTc4NTMwNDI@._V1_.jpg',
      banner:
        'https://m.media-amazon.com/images/M/MV5BMTg1MTY2MjYzNV5BMl5BanBnXkFtZTgwMTc4NTMwNDI@._V1_.jpg',
      trailer: 'https://www.youtube.com/watch?v=xjDjIWPwcPU',
      rating: 7.3,
      maturityRating: MaturityRating.PG13,
      viewCount: 1800000,
      categories: [categoriesSeed[0], categoriesSeed[7]],
      tags: [tagsSeed[6], tagsSeed[15]],
      actors: [actorsSeed[7], actorsSeed[8]],
      directors: [directorsSeed[3]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 134,
    },
  },
  {
    duration: 122,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Joker',
      description: 'An origin story of the infamous villain Joker.',
      releaseDate: new Date('2019-10-04'),
      thumbnail: 'https://tr.web.img2.acsta.net/c_310_420/pictures/19/09/11/16/43/1511539.jpg',
      banner: 'https://tr.web.img2.acsta.net/c_310_420/pictures/19/09/11/16/43/1511539.jpg',
      trailer: 'https://www.youtube.com/watch?v=zAGVQLHvwOY',
      rating: 8.4,
      maturityRating: MaturityRating.R,
      viewCount: 2000000,
      categories: [categoriesSeed[3], categoriesSeed[4]],
      tags: [tagsSeed[5], tagsSeed[14], tagsSeed[15]],
      actors: [actorsSeed[5], actorsSeed[4]],
      directors: [directorsSeed[0]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 122,
    },
  },
  {
    duration: 130,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Thor: Ragnarok',
      description: 'Thor must escape from Sakaar and save Asgard from Hela.',
      releaseDate: new Date('2017-11-03'),
      thumbnail:
        'https://play-lh.googleusercontent.com/H6bqIWE2Gd2myPbEncSOdu8LyLKxoNZVW9z03Os8BiMVG-FBtgpf2huX8jmWqfMRzSdOSw',
      banner:
        'https://play-lh.googleusercontent.com/H6bqIWE2Gd2myPbEncSOdu8LyLKxoNZVW9z03Os8BiMVG-FBtgpf2huX8jmWqfMRzSdOSw',
      trailer: 'https://www.youtube.com/watch?v=ue80QwXMRHg',
      rating: 7.9,
      maturityRating: MaturityRating.PG13,
      viewCount: 1700000,
      categories: [categoriesSeed[0], categoriesSeed[7]],
      tags: [tagsSeed[6], tagsSeed[15], tagsSeed[13]],
      actors: [actorsSeed[7], actorsSeed[8], actorsSeed[6]],
      directors: [directorsSeed[3]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 130,
    },
  },
  {
    duration: 121,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Guardians of the Galaxy',
      description: 'A group of intergalactic criminals must save the galaxy.',
      releaseDate: new Date('2014-08-01'),
      thumbnail:
        'https://m.media-amazon.com/images/M/MV5BM2ZmNjQ2MzAtNDlhNi00MmQyLWJhZDMtNmJiMjFlOWY4MzcxXkEyXkFqcGc@._V1_.jpg',
      banner:
        'https://m.media-amazon.com/images/M/MV5BM2ZmNjQ2MzAtNDlhNi00MmQyLWJhZDMtNmJiMjFlOWY4MzcxXkEyXkFqcGc@._V1_.jpg',
      trailer: 'https://www.youtube.com/watch?v=d96cjJhvlMA',
      rating: 8.0,
      maturityRating: MaturityRating.PG13,
      viewCount: 1900000,
      categories: [categoriesSeed[0], categoriesSeed[2]],
      tags: [tagsSeed[6], tagsSeed[2], tagsSeed[8]],
      actors: [actorsSeed[7], actorsSeed[8], actorsSeed[10]],
      directors: [directorsSeed[3]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 121,
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
      thumbnail: 'https://i.scdn.co/image/ab67616d0000b27359235d40e20d96dd8c40ffd2',
      banner: 'https://i.scdn.co/image/ab67616d0000b27359235d40e20d96dd8c40ffd2',
      trailer: 'https://www.youtube.com/watch?v=7TavVZMewpY',
      rating: 8.5,
      maturityRating: MaturityRating.G,
      viewCount: 2500000,
      categories: [categoriesSeed[5], categoriesSeed[4]],
      tags: [tagsSeed[3], tagsSeed[11]],
      actors: [actorsSeed[11]],
      directors: [directorsSeed[2]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 118,
    },
  },
  {
    duration: 102,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Frozen',
      description: 'A princess sets out to save her kingdom from eternal winter.',
      releaseDate: new Date('2013-11-27'),
      thumbnail:
        'https://www.cgv.vn/media/catalog/product/cache/3/image/c5f0a1eff4c394a251036189ccddaacd/p/o/poster_frozen_nhbg_-final_1_.jpg',
      banner:
        'https://www.cgv.vn/media/catalog/product/cache/3/image/c5f0a1eff4c394a251036189ccddaacd/p/o/poster_frozen_nhbg_-final_1_.jpg',
      trailer: 'https://www.youtube.com/watch?v=TbQm5doF_Uc',
      rating: 7.5,
      maturityRating: MaturityRating.G,
      viewCount: 2100000,
      categories: [categoriesSeed[5], categoriesSeed[7]],
      tags: [tagsSeed[11], tagsSeed[10]],
      actors: [actorsSeed[11]],
      directors: [directorsSeed[2]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 102,
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
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 143,
    },
  },
  {
    duration: 107,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Moana',
      description: 'A young girl sets sail to save her island and discover her identity.',
      releaseDate: new Date('2016-11-23'),
      thumbnail: 'https://upload.wikimedia.org/wikipedia/vi/5/56/Moana_2016_%28Poster%29.jpg',
      banner: 'https://upload.wikimedia.org/wikipedia/vi/5/56/Moana_2016_%28Poster%29.jpg',
      trailer: 'https://www.youtube.com/watch?v=LKFuXETZUsI',
      rating: 7.6,
      maturityRating: MaturityRating.G,
      viewCount: 1200000,
      categories: [categoriesSeed[5], categoriesSeed[7]],
      tags: [tagsSeed[11], tagsSeed[3]],
      actors: [actorsSeed[11]],
      directors: [directorsSeed[2]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 107,
    },
  },
  {
    duration: 141,
    metaData: {
      type: ContentType.MOVIE,
      title: 'Wonder Woman',
      description: 'Diana, princess of the Amazons, discovers her powers and destiny.',
      releaseDate: new Date('2017-06-02'),
      thumbnail:
        'https://upload.wikimedia.org/wikipedia/en/b/b0/Wonder_Woman_%282017_film%29_poster.jpg',
      banner:
        'https://upload.wikimedia.org/wikipedia/en/b/b0/Wonder_Woman_%282017_film%29_poster.jpg',
      trailer: 'https://www.youtube.com/watch?v=VSB4wGIdDwo',
      rating: 7.4,
      maturityRating: MaturityRating.PG13,
      viewCount: 1600000,
      categories: [categoriesSeed[0], categoriesSeed[7]],
      tags: [tagsSeed[15], tagsSeed[6]],
      actors: [actorsSeed[7], actorsSeed[8]],
      directors: [directorsSeed[3]],
    },
    video: {
      videoUrl:
        'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
      duration: 141,
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
        thumbnail: `https://res.cloudinary.com/dpazxfkpx/image/upload/v1764073226/default_banner_zcrfgr.jpg`,
        banner: `https://res.cloudinary.com/dpazxfkpx/image/upload/v1764073226/default_banner_zcrfgr.jpg`,
        trailer: `https://www.youtube.com/watch?v=PypDSyIRRSs`,
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
                videoUrl: `https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8`,
                duration: 20 + Math.floor(Math.random() * 20),
              },
            },
            {
              episodeNumber: 2,
              episodeDuration: 20 + Math.floor(Math.random() * 20),
              episodeTitle: `Episode 2 of TV Series ${i + 1}`,
              video: {
                videoUrl: `https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8`,
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

export const tvSeriesSeed = [
  // Breaking Bad
  {
    duration: 47,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'Breaking Bad',
      description:
        "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine to secure his family's future.",
      releaseDate: new Date('2025-10-20'),
      thumbnail:
        'https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg',
      banner:
        'https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg',
      trailer: 'https://www.youtube.com/watch?v=HhesaQXLuRY',
      rating: 9.5,
      maturityRating: MaturityRating.R,
      viewCount: 1500000,
      categories: [categoriesSeed[3], categoriesSeed[4]], // Crime, Drama
      tags: [tagsSeed[14], tagsSeed[13]], // Villain, War
      actors: [actorsSeed[4]], // Christian Bale (placeholder, actually Bryan Cranston)
      directors: [directorsSeed[3]], // Taika Waititi (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 7,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 58,
            episodeTitle: 'Pilot',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 58,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 48,
            episodeTitle: "Cat's in the Bag...",
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 48,
            },
          },
        ],
      },
    ],
  },
  // Game of Thrones
  {
    duration: 57,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'Game of Thrones',
      description:
        'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
      releaseDate: new Date('2025-10-20'),
      thumbnail:
        'https://m.media-amazon.com/images/M/MV5BYTRiNDQwYzAtMzVlZS00NTI5LWJjYjUtMzkwNTUzMWMxZTllXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_.jpg',
      banner:
        'https://m.media-amazon.com/images/M/MV5BYTRiNDQwYzAtMzVlZS00NTI5LWJjYjUtMzkwNTUzMWMxZTllXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_.jpg',
      trailer: 'https://www.youtube.com/watch?v=KPLWWIOCOOQ',
      rating: 9.2,
      maturityRating: MaturityRating.R,
      viewCount: 2000000,
      categories: [categoriesSeed[0], categoriesSeed[4]], // Action, Drama
      tags: [tagsSeed[13], tagsSeed[14]], // War, Villain
      actors: [actorsSeed[10]], // Benedict Cumberbatch (placeholder)
      directors: [directorsSeed[0]], // Christopher Nolan (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 10,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 62,
            episodeTitle: 'Winter Is Coming',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 62,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 56,
            episodeTitle: 'The Kingsroad',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 56,
            },
          },
        ],
      },
    ],
  },
  // The Office (US)
  {
    duration: 22,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'The Office',
      description:
        'A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.',
      releaseDate: new Date('2025-10-20'),
      thumbnail: 'https://m.media-amazon.com/images/I/81vj15-NuoL._AC_UF894,1000_QL80_.jpg',
      banner: 'https://m.media-amazon.com/images/I/81vj15-NuoL._AC_UF894,1000_QL80_.jpg',
      trailer: 'https://www.youtube.com/watch?v=2Z0QM6wHOFY',
      rating: 9.0,
      maturityRating: MaturityRating.PG13,
      viewCount: 1800000,
      categories: [categoriesSeed[6]], // Comedy
      tags: [tagsSeed[10]], // Love
      actors: [actorsSeed[12]], // Ryan Reynolds (placeholder)
      directors: [directorsSeed[3]], // Taika Waititi (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 6,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 23,
            episodeTitle: 'Pilot',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 23,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 22,
            episodeTitle: 'Diversity Day',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 22,
            },
          },
        ],
      },
    ],
  },
  // Friends
  {
    duration: 22,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'Friends',
      description:
        'Follows the personal and professional lives of six twenty to thirty-something-year-old friends living in Manhattan.',
      releaseDate: new Date('2025-10-20'),
      thumbnail:
        'https://upload.wikimedia.org/wikipedia/vi/thumb/7/7c/Friends_titles.png/260px-Friends_titles.png',
      banner:
        'https://upload.wikimedia.org/wikipedia/vi/thumb/7/7c/Friends_titles.png/260px-Friends_titles.png',
      trailer: 'https://www.youtube.com/watch?v=hDNNmeeJs1Q',
      rating: 8.9,
      maturityRating: MaturityRating.PG13,
      viewCount: 2200000,
      categories: [categoriesSeed[6]], // Comedy
      tags: [tagsSeed[10]], // Love
      actors: [actorsSeed[3]], // Anne Hathaway (placeholder)
      directors: [directorsSeed[3]], // Taika Waititi (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 24,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 22,
            episodeTitle: 'The One Where Monica Gets a Roommate',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 22,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 22,
            episodeTitle: 'The One with the Sonogram at the End',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 22,
            },
          },
        ],
      },
    ],
  },
  // Stranger Things
  {
    duration: 51,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'Stranger Things',
      description:
        'When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back.',
      releaseDate: new Date('2025-10-20'),
      thumbnail:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Stranger_Things_logo.png/250px-Stranger_Things_logo.png',
      banner:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Stranger_Things_logo.png/250px-Stranger_Things_logo.png',
      trailer: 'https://www.youtube.com/watch?v=XWxyRG_tF7Y',
      rating: 8.7,
      maturityRating: MaturityRating.PG13,
      viewCount: 2500000,
      categories: [categoriesSeed[1], categoriesSeed[4]], // Sci-Fi, Drama
      tags: [tagsSeed[7], tagsSeed[14]], // AI, Villain
      actors: [actorsSeed[11]], // Amy Adams (placeholder)
      directors: [directorsSeed[3]], // Taika Waititi (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 8,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 49,
            episodeTitle: 'Chapter One: The Vanishing of Will Byers',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 49,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 56,
            episodeTitle: 'Chapter Two: The Weirdo on Maple Street',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 56,
            },
          },
        ],
      },
    ],
  },
  // The Mandalorian
  {
    duration: 40,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'The Mandalorian',
      description:
        'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.',
      releaseDate: new Date('2025-10-20'),
      thumbnail:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQa6lKT2i-ZL7iT4CwIYzWKjCmFaPJ3exijaz1T5qI69wDAHHnks09RgIuIBS7uPIJYxqVJ7bRSxkQ9OMXdn-BMdj97CmDSW3aL2igwnD4&s=10',
      banner:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQa6lKT2i-ZL7iT4CwIYzWKjCmFaPJ3exijaz1T5qI69wDAHHnks09RgIuIBS7uPIJYxqVJ7bRSxkQ9OMXdn-BMdj97CmDSW3aL2igwnD4&s=10',
      trailer: 'https://www.youtube.com/watch?v=aOC8E8z_ifw',
      rating: 8.7,
      maturityRating: MaturityRating.PG13,
      viewCount: 1900000,
      categories: [categoriesSeed[0], categoriesSeed[1]], // Action, Sci-Fi
      tags: [tagsSeed[6], tagsSeed[2]], // Marvel, Space
      actors: [actorsSeed[9]], // Tom Holland (placeholder)
      directors: [directorsSeed[3]], // Taika Waititi (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 8,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 39,
            episodeTitle: 'Chapter 1: The Mandalorian',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 39,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 32,
            episodeTitle: 'Chapter 2: The Child',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 32,
            },
          },
        ],
      },
    ],
  },
  // The Crown
  {
    duration: 58,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'The Crown',
      description:
        "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century.",
      releaseDate: new Date('2025-10-20'),
      thumbnail:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBw7bpXkZx4BgaamjwnWXCHtVSMvbvyiMuqkeHo2HP8rZqUDXZzJH1fDobmYVEc27xDRzqm3qD2mkXj9_WC4tB-Cg8PkME4OEAizhrb30&s=10',
      banner:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBw7bpXkZx4BgaamjwnWXCHtVSMvbvyiMuqkeHo2HP8rZqUDXZzJH1fDobmYVEc27xDRzqm3qD2mkXj9_WC4tB-Cg8PkME4OEAizhrb30&s=10',
      trailer: 'https://www.youtube.com/watch?v=JWtnJjn6ng0',
      rating: 8.6,
      maturityRating: MaturityRating.PG13,
      viewCount: 1400000,
      categories: [categoriesSeed[4]], // Drama
      tags: [tagsSeed[13]], // War
      actors: [actorsSeed[3]], // Anne Hathaway (placeholder)
      directors: [directorsSeed[3]], // Taika Waititi (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 10,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 63,
            episodeTitle: 'Wolferton Splash',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 63,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 58,
            episodeTitle: 'Hyde Park Corner',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 58,
            },
          },
        ],
      },
    ],
  },
  // Black Mirror
  {
    duration: 60,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'Black Mirror',
      description:
        "An anthology series exploring a twisted, high-tech world where humanity's greatest innovations and darkest instincts collide.",
      releaseDate: new Date('2025-10-20'),
      thumbnail:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkr6TWq2BGnvBK6s5B6eDnp3GXUBE_zGejyh9vlDEzKZt8DKeR6TI1stlz6QOQWP3gKqzKZkiDxnBnqBzAIXJ3lcbJam2uRx9y8UyqcHs&s',
      banner:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkr6TWq2BGnvBK6s5B6eDnp3GXUBE_zGejyh9vlDEzKZt8DKeR6TI1stlz6QOQWP3gKqzKZkiDxnBnqBzAIXJ3lcbJam2uRx9y8UyqcHs&s',
      trailer: 'https://www.youtube.com/watch?v=zLZHdK4y7lo',
      rating: 8.8,
      maturityRating: MaturityRating.R,
      viewCount: 1600000,
      categories: [categoriesSeed[1], categoriesSeed[4]], // Sci-Fi, Drama
      tags: [tagsSeed[7], tagsSeed[14]], // AI, Villain
      actors: [actorsSeed[10]], // Benedict Cumberbatch (placeholder)
      directors: [directorsSeed[0]], // Christopher Nolan (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 3,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 63,
            episodeTitle: 'Fifteen Million Merits',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 63,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 49,
            episodeTitle: 'White Christmas',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 49,
            },
          },
        ],
      },
    ],
  },
  // The Witcher
  {
    duration: 60,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'The Witcher',
      description:
        'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
      releaseDate: new Date('2025-10-20'),
      thumbnail:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBw7bpXkZx4BgaamjwnWXCHtVSMvbvyiMuqkeHo2HP8rZqUDXZzJH1fDobmYVEc27xDRzqm3qD2mkXj9_WC4tB-Cg8PkME4OEAizhrb30&s=10',
      banner:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBw7bpXkZx4BgaamjwnWXCHtVSMvbvyiMuqkeHo2HP8rZqUDXZzJH1fDobmYVEc27xDRzqm3qD2mkXj9_WC4tB-Cg8PkME4OEAizhrb30&s=10',
      trailer: 'https://www.youtube.com/watch?v=ndl1W4ltcmg',
      rating: 8.2,
      maturityRating: MaturityRating.R,
      viewCount: 1700000,
      categories: [categoriesSeed[0], categoriesSeed[7]], // Action, Fantasy
      tags: [tagsSeed[13], tagsSeed[14]], // War, Villain
      actors: [actorsSeed[4]], // Christian Bale (placeholder)
      directors: [directorsSeed[3]], // Taika Waititi (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 8,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 63,
            episodeTitle: "The End's Beginning",
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 63,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 60,
            episodeTitle: 'Four Marks',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 60,
            },
          },
        ],
      },
    ],
  },
  // The Sopranos
  {
    duration: 55,
    metaData: {
      type: ContentType.TVSERIES,
      title: 'The Sopranos',
      description:
        'New Jersey mob boss Tony Soprano deals with personal and professional issues in his home and business life that affect his mental state, leading him to seek professional psychiatric counseling.',
      releaseDate: new Date('2025-10-20'),
      thumbnail:
        'https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p7894124_b_v8_ab.jpg',
      banner:
        'https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p7894124_b_v8_ab.jpg',
      trailer: 'https://www.youtube.com/watch?v=6Q3D4rZ8JnM',
      rating: 9.2,
      maturityRating: MaturityRating.R,
      viewCount: 1300000,
      categories: [categoriesSeed[3], categoriesSeed[4]], // Crime, Drama
      tags: [tagsSeed[14]], // Villain
      actors: [actorsSeed[2]], // Matthew McConaughey (placeholder)
      directors: [directorsSeed[1]], // James Cameron (placeholder)
    },
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 13,
        episodes: [
          {
            episodeNumber: 1,
            episodeDuration: 56,
            episodeTitle: 'Pilot',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 56,
            },
          },
          {
            episodeNumber: 2,
            episodeDuration: 50,
            episodeTitle: '46 Long',
            video: {
              videoUrl:
                'https://cinematok2-bucket.s3.ap-southeast-1.amazonaws.com/videos/fdad2420-c23a-4a14-9b4f-19dd276e4cf0/hls/master.m3u8',
              duration: 50,
            },
          },
        ],
      },
    ],
  },
  ...generateTVSeries(60),
];

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
