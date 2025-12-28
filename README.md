# CINEMAKATOK25 Server

A comprehensive cinema management system backend API built with NestJS framework, providing robust solutions for content management, scheduling, and user authentication.


## Overview

CINEMAKATOK25 Server is a production-ready backend system for cinema management, featuring:

- User authentication and authorization with JWT
- Content management system (CMS) for movies and TV series
- Program scheduling (PEP - Program Scheduling Module)
- Audit logging and activity tracking
- Video processing queue with HLS streaming
- Real-time notifications via email
- Cloud storage integration (AWS S3, Cloudflare R2)

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) v10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Package Manager**: pnpm
- **Video Processing**: FFmpeg
- **Cloud Storage**: AWS S3, Cloudflare R2
- **Email**: Nodemailer (SMTP)
- **Authentication**: JWT, OAuth2 (Google)
- **Documentation**: Swagger/OpenAPI
- **CI/CD**: GitHub Actions
- **Containerization**: Docker

## Features

### Authentication Module ([`src/auth`](src/auth))

- JWT-based authentication with refresh tokens
- OAuth2 integration (Google)
- Email verification and password reset
- Two-factor authentication (2FA)
- User profile management
- Role-based access control (RBAC)

### CMS Module ([`src/cms`](src/cms))

- Movie and TV series management
- Actor and director profiles
- Category and tag systems
- Video upload and processing
- HLS streaming support
- Thumbnail generation
- Content search with PostgreSQL similarity

### PEP Module ([`src/pep`](src/pep))

- Movie scheduling and showtimes
- Seat reservation system
- Ticket booking
- Payment integration

### Audit Log Module ([`src/audit-log`](src/audit-log))

- User activity tracking
- Content view statistics
- Analytics and reporting
- Trending content detection

### Video Processing ([`libs/core/src/queue`](libs/core/src/queue))

- Video transcoding to HLS format
- Multiple quality support (480p, 720p, 1080p)
- Sprite generation for video preview
- VTT subtitle support
- Queue-based processing with Bull

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.19.0 or >= 20.6.0
- **pnpm** >= 9.0.0
- **PostgreSQL** >= 14.x
- **Redis** >= 6.x (optional, for queue processing)
- **FFmpeg** (for video processing)
- **Docker** (optional, for containerized deployment)

### Install pnpm

```bash
npm install -g pnpm
```

### Install FFmpeg

**Windows:**

```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**Linux:**

```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**

```bash
brew install ffmpeg
```

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/TLCN-OTT/CINEMAKATOK25-SERVER.git
cd CINEMAKATOK25-SERVER
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create configuration files in the [`config`](config) directory:

```bash
# Copy example configuration
cp config/default.js config/local.js
```

Edit [`config/local.js`](config/local.js) with your local settings (see [Configuration](#configuration) section below).

## ⚙️ Configuration

### Database Configuration

Edit [`config/local.js`](config/local.js):

```javascript
module.exports = {
  core: {
    database: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'your_db_user',
      password: 'your_db_password',
      dbName: 'cinemakatok25',
      synchronize: true, // Set to false in production
      caCertificate: null, // For SSL connections
    },
  },
};
```

### Email Configuration

Add to [`config/local.js`](config/local.js):

```javascript
email: {
  host: 'smtp.gmail.com',
  port: 587,
  user: 'your_email@gmail.com',
  pass: 'your_app_password', // Use App Password for Gmail
  fromName: 'CINEMAKATOK25',
  secure: false,
}
```

### AWS S3 Configuration

```javascript
aws: {
  accessKeyId: 'your_aws_access_key',
  secretAccessKey: 'your_aws_secret_key',
  region: 'ap-southeast-1',
  bucketName: 'your-bucket-name',
  s3BucketUrl: 'https://your-bucket.s3.amazonaws.com',
  cloudfrontDomain: 'your-cloudfront-domain.cloudfront.net',
  cloudfrontKeyPairId: 'your-key-pair-id',
  cloudfrontPrivateKey: 'your-private-key',
}
```

### Redis Configuration (Optional)

```javascript
redis: {
  host: 'localhost',
  port: 6379,
  password: 'your_redis_password', // if required
}
```

### Environment Variables

Alternatively, you can use environment variables. See [`config/custom-environment-variables.js`](config/custom-environment-variables.js) for the complete list.

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development

# Database
CORE_DATABASE_HOST=localhost
CORE_DATABASE_PORT=5432
CORE_DATABASE_USERNAME=postgres
CORE_DATABASE_PASSWORD=your_password
CORE_DATABASE_DB_NAME=cinemakatok25

# JWT
JWT_PRIVATE_KEY=your_jwt_private_key
JWT_PUBLIC_KEY=your_jwt_public_key
ACCESS_TOKEN_EXPIRES_TIME=5m
REFRESH_TOKEN_EXPIRES_TIME=7d

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=your_bucket

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_NAME=CINEMAKATOK25

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## Database Setup

### 1. Create Database

```bash
# Using psql
psql -U postgres
CREATE DATABASE cinemakatok25;
\q
```

### 2. Enable PostgreSQL Extensions

```sql
-- Connect to your database
\c cinemakatok25

-- Enable extensions for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
```

### 3. Run Migrations

```bash
pnpm run migration:run
```

### 4. Seed Database (Optional)

Populate the database with sample data:

```bash
ts-node db/run-seed.ts
```

This will create:

- Sample users (admin and regular users)
- Categories and tags
- Actors and directors
- Movies and TV series with episodes
- Audit logs for testing

See [`db/seed-data.ts`](db/seed-data.ts) for all seed data.

## Running the Application

### Development Mode

```bash
# Start with hot-reload
pnpm run start:dev
```

The server will start at `http://localhost:3000`

### Production Mode

```bash
# Build the application
pnpm run build

# Start production server
pnpm run start:prod
```

### Debug Mode

```bash
pnpm run start:debug
```

### Video Worker (for video processing)

Run the video processing worker separately:

```bash
pnpm run worker:video
```

See [`libs/core/src/queue/video-worker.ts`](libs/core/src/queue/video-worker.ts) for details.

## 📚 API Documentation

After starting the server, access the interactive API documentation:

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/api/health`

### Authentication

Most endpoints require authentication. Use the `/auth/login` endpoint to get a JWT token:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'
```

Use the returned token in subsequent requests:

```bash
curl -X GET http://localhost:3000/cms/movies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Key Endpoints

#### Authentication ([`src/auth/controllers`](src/auth/controllers))

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/verify-email` - Verify email address

#### CMS ([`src/cms/controllers`](src/cms/controllers))

- `GET /cms/movies` - List all movies
- `GET /cms/movies/:id` - Get movie details
- `POST /cms/movies` - Create movie (Admin only)
- `PUT /cms/movies/:id` - Update movie (Admin only)
- `DELETE /cms/movies/:id` - Delete movie (Admin only)
- `GET /cms/actors` - List all actors
- `GET /cms/directors` - List all directors
- `POST /cms/videos/upload` - Upload video

#### Analytics ([`src/cms/services/analytics.service.ts`](src/cms/services/analytics.service.ts))

- `GET /cms/analytics/movies` - Movie view statistics
- `GET /cms/analytics/trending` - Trending content

## Docker Deployment

### Build Docker Image

```bash
docker build -t cinemakatok25-server .
```

See [`Dockerfile`](Dockerfile) for build configuration.

### Run with Docker

```bash
docker run -d \
  --name cinemakatok25 \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e CORE_DATABASE_HOST=your_db_host \
  -e CORE_DATABASE_PORT=5432 \
  -e CORE_DATABASE_USERNAME=your_user \
  -e CORE_DATABASE_PASSWORD=your_password \
  -e CORE_DATABASE_DB_NAME=cinemakatok25 \
  cinemakatok25-server
```

### Docker Compose (Recommended)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      CORE_DATABASE_HOST: postgres
      CORE_DATABASE_PORT: 5432
      CORE_DATABASE_USERNAME: postgres
      CORE_DATABASE_PASSWORD: postgres
      CORE_DATABASE_DB_NAME: cinemakatok25
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./exports:/app/exports

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cinemakatok25
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

Run with:

```bash
docker-compose up -d
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment.

See [`.github/workflows/cicd.yml`](.github/workflows/cicd.yml) for the complete pipeline.

### Workflow

1. **Code Quality Check**
   - Prettier formatting
   - ESLint validation

2. **Build & Test**
   - TypeScript compilation
   - Unit tests
   - Build Docker image

3. **Deploy to EC2** (on push to `develop` branch)
   - Push image to Docker Hub
   - SSH to EC2 instance
   - Pull latest image
   - Restart container
   - Health check validation

### Required GitHub Secrets

Configure these secrets in your repository settings:

```
# Docker Hub
DOCKER_USERNAME
DOCKER_PASSWORD

# EC2 Deployment
EC2_HOST
EC2_USER
EC2_SSH_KEY

# Database
CORE_DATABASE_HOST
CORE_DATABASE_PORT
CORE_DATABASE_USERNAME
CORE_DATABASE_PASSWORD
CORE_DATABASE_DB_NAME
DB_CA_CERTIFICATE

# JWT
JWT_PRIVATE_KEY
JWT_PUBLIC_KEY

# AWS
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_BUCKET_NAME
AWS_S3_BUCKET_URL
AWS_CLOUDFRONT_DOMAIN
AWS_CLOUDFRONT_KEY_PAIR_ID
AWS_CLOUDFRONT_PRIVATE_KEY

# Email
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
FROM_NAME

# Redis
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
```

## Project Structure

```
├── .github/
│   └── workflows/
│       └── cicd.yml              # CI/CD pipeline configuration
├── config/                        # Configuration files
│   ├── default.js                 # Default configuration
│   ├── local.js                   # Local overrides (git-ignored)
│   └── custom-environment-variables.js  # Environment mapping
├── db/                            # Database utilities
│   ├── migration.config.ts        # TypeORM migration config
│   ├── seed-data.ts               # Seed data definitions
│   └── run-seed.ts                # Seed execution script
├── libs/                          # Shared libraries
│   ├── common/                    # Common utilities
│   │   ├── base/                  # Base classes and DTOs
│   │   ├── decorators/            # Custom decorators
│   │   ├── enums/                 # Global enums
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth guards
│   │   ├── interceptors/          # HTTP interceptors
│   │   ├── pipes/                 # Validation pipes
│   │   └── utils/                 # Utility functions
│   │       ├── excel/             # Excel export service
│   │       ├── hls/               # Video HLS processing
│   │       └── nest/              # NestJS bootstrap utilities
│   └── core/                      # Core business logic
│       ├── database/              # Database module
│       ├── queue/                 # Queue processing
│       │   ├── queue.service.ts   # Queue service
│       │   └── video-worker.ts    # Video processing worker
│       └── storage/               # Cloud storage services
├── src/                           # Application source
│   ├── app.module.ts              # Root module
│   ├── main.ts                    # Application entry point
│   ├── auth/                      # Authentication module
│   │   ├── controllers/           # Auth controllers
│   │   ├── services/              # Auth services
│   │   │   └── email.service.ts   # Email notification service
│   │   ├── guards/                # Auth guards
│   │   └── strategies/            # Passport strategies
│   ├── cms/                       # Content Management System
│   │   ├── controllers/           # CMS controllers
│   │   │   ├── actor.controller.ts
│   │   │   ├── director.controller.ts
│   │   │   ├── movie.controller.ts
│   │   │   └── video.controller.ts
│   │   ├── services/              # CMS services
│   │   │   ├── actor.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── director.service.ts
│   │   │   ├── movie.service.ts
│   │   │   ├── s3.service.ts      # AWS S3 integration
│   │   │   └── video.service.ts
│   │   ├── entities/              # Database entities
│   │   ├── dtos/                  # Data transfer objects
│   │   │   └── director.dto.ts
│   │   └── config/                # Module config
│   │       └── upload.config.ts   # File upload configuration
│   ├── pep/                       # Program Scheduling Module
│   │   ├── controllers/
│   │   ├── services/
│   │   └── entities/
│   └── audit-log/                 # Audit logging module
│       ├── controllers/
│       ├── services/
│       └── entities/
├── test/                          # Test files
├── exports/                       # Generated export files
├── uploads/                       # Uploaded media files
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .gitignore                     # Git ignore rules
├── Dockerfile                     # Docker build configuration
├── nest-cli.json                  # NestJS CLI configuration
├── package.json                   # Dependencies and scripts
├── pnpm-lock.yaml                 # pnpm lock file
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

### Key Files

- [`src/main.ts`](src/main.ts) - Application entry point
- [`src/app.module.ts`](src/app.module.ts) - Root module
- [`libs/common/src/utils/nest/setup-bootstrap.ts`](libs/common/src/utils/nest/setup-bootstrap.ts) - Bootstrap configuration
- [`libs/core/src/queue/queue.service.ts`](libs/core/src/queue/queue.service.ts) - Queue service for video processing
- [`libs/common/src/utils/hls/video-hls.ts`](libs/common/src/utils/hls/video-hls.ts) - HLS video processing
- [`config/custom-environment-variables.js`](config/custom-environment-variables.js) - Environment variable mapping

## Available Scripts

See [`package.json`](package.json) for all available scripts:

### Development

```bash
pnpm run start:dev        # Start development server with hot-reload
pnpm run start:debug      # Start in debug mode
```

### Production

```bash
pnpm run build            # Build for production
pnpm run start:prod       # Start production server
```

### Testing

```bash
pnpm run test             # Run unit tests
pnpm run test:watch       # Run tests in watch mode
pnpm run test:cov         # Run tests with coverage
pnpm run test:e2e         # Run end-to-end tests
```

### Code Quality

```bash
pnpm run lint             # Run ESLint
pnpm run format           # Format code with Prettier
pnpm run prettier         # Check code formatting
```

### Database

```bash
pnpm run migration:run    # Run pending migrations
pnpm run migration:revert # Revert last migration
ts-node db/run-seed.ts    # Seed database
```

### Workers

```bash
pnpm run worker:video     # Start video processing worker
```

## Testing

### Unit Tests

```bash
pnpm run test
```

### Watch Mode

```bash
pnpm run test:watch
```

### Coverage Report

```bash
pnpm run test:cov
```

Coverage reports are generated in [`coverage/`](coverage) directory.

### End-to-End Tests

```bash
pnpm run test:e2e
```

## 🔧 Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running:

```bash
# Check status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

2. Test connection:

```bash
psql -h localhost -U postgres -d cinemakatok25
```

3. Check [`config/local.js`](config/local.js) credentials

### Video Processing Issues

1. Verify FFmpeg installation:

```bash
ffmpeg -version
```

2. Check video worker logs:

```bash
pnpm run worker:video
```

3. Verify Redis connection (if using queue):

```bash
redis-cli ping
```

### Port Already in Use

If port 3000 is already in use, change the port in configuration:

```javascript
// config/local.js
module.exports = {
  port: 3001, // Change to desired port
};
```

Or set environment variable:

```bash
PORT=3001 pnpm run start:dev
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run `pnpm run lint` and `pnpm run format` before committing
- Write tests for new features
- Update documentation as needed

## License

This project is [UNLICENSED] - Private project for CINEMAKATOK25 team.

## Team

**CINEMAKATOK25 Development Team**

For support or questions, contact the development team.

---

**Built with ❤️ using [NestJS](https://nestjs.com/)**
