const { aws, redis } = require('./custom-environment-variables');

module.exports = {
  //Server configuration
  port: 3000,
  appName: 'APP_NAME',
  jwt: {
    privateKey: 'your_private_key',
    publicKey: 'your_public_key',
    expiresTime: '5m',
    refreshExpiresTime: '7d',
  },
  aws: {
    accessKeyId: 'your_access_key_id',
    secretAccessKey: 'your_secret_access_key',
    region: 'your_aws_region',
    bucketName: 'your_bucket_name',
    s3BucketUrl: 'https://your_bucket_name.s3.amazonaws.com',
    cloudfrontDomain: 'your_cloudfront_domain',
    cloudfrontKeyPairId: 'your_cloudfront_key_pair_id',
    cloudfrontPrivateKey: 'your_cloudfront_private_key',
  },
  // Email configuration
  email: {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'your_email@gmail.com',
    pass: 'your_email_password',
    fromName: 'your_app_name',
    secure: false,
  },
  redis: {
    host: 'your_redis_host',
    port: 6379,
    password: 'your_redis_password',
  },

  // Core Config
  core: {
    database: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      dbName: 'postgres',
      synchronize: true,
      caCertificate: null,
    },
    cache: {
      store: 'memory',
      ttl: 5000,
      max: 100,
    },
    healthCheck: {
      disk: {
        path: 'C:\\',
        thresholdPercent: 0.6,
        enable: false,
      },
      memory: {
        heapThreshold: 314572800,
        rssThreshold: 314572800,
        enableHeapCheck: false,
        enableRssCheck: false,
      },
      database: {
        enable: true,
      },
      http: {
        url: 'http://localhost:3000/docs#',
        enable: true,
      },
    },
    axios: {
      timeout: 3000,
    },
  },
};
