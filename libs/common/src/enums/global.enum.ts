export enum USER_STATUS {
  ACTIVATED = 'ACTIVATED',
  DEACTIVATED = 'DEACTIVATED',
  BANNED = 'BANNED',
}

export enum OTP_PURPOSE {
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH',
  REGISTRATION = 'REGISTRATION',
  CHANGE_EMAIL = 'CHANGE_EMAIL',
}

export enum RESOLUTION {
  LOW = '480p',
  MEDIUM = '720p',
  HIGH = '1080p',
  ULTRA = '2K',
}

export enum GENDER {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum MaturityRating {
  G = 'G', // General Audiences
  PG = 'PG', // Parental Guidance
  PG13 = 'PG-13', // Parents Strongly Cautioned
  R = 'R', // Restricted
  NC17 = 'NC-17', // Adults Only
  TV_Y = 'TV-Y', // All Children
  TV_PG = 'TV-PG', // Parental Guidance Suggested
  TV_14 = 'TV-14', // Parents Strongly Cautioned
  TV_MA = 'TV-MA', // Mature Audience Only
}

export enum VIDEO_STATUS {
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}
