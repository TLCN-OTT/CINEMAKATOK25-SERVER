/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { DataSource, DataSourceOptions } from 'typeorm';

import { getConfig } from '@app/common/utils/get-config';

const dataSourceOptions: DataSourceOptions = {
  type: getConfig('core.database.type', 'postgres') as any,
  host: getConfig('core.database.host', 'localhost') as string,
  port: getConfig('core.database.port', 5432) as number,
  username: getConfig('core.database.username', 'user') as string,
  password: getConfig('core.database.password', 'password') as string,
  database: getConfig('core.database.dbName', 'dbname') as string,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['db/migrations/*{.ts,.js}'],
  synchronize: false,
};

export const connectionSource = new DataSource(dataSourceOptions);
