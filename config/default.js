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
