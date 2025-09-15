import { setupBootstrap } from 'libs/common/src/utils/nest';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupBootstrap(app);
}
void bootstrap();
