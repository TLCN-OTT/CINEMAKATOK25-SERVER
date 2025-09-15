/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as config from 'config';
import { DataSource, DataSourceOptions } from 'typeorm';

// Helper function to get config value and handle function case
const getConfigValue = (key: string): string | number => {
  const value = config.get(key);
  if (typeof value === 'function') {
    return (value as () => string | number)();
  }
  return value as string | number;
};

const dataSourceOptions: DataSourceOptions = {
  type: getConfigValue('core.database.type') as any,
  host: getConfigValue('core.database.host') as string,
  port: getConfigValue('core.database.port') as number,
  username: getConfigValue('core.database.username') as string,
  password: getConfigValue('core.database.password') as string,
  database: getConfigValue('core.database.dbName') as string,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['db/migrations/*{.ts,.js}'],
  synchronize: false,
};

export const connectionSource = new DataSource(dataSourceOptions);
