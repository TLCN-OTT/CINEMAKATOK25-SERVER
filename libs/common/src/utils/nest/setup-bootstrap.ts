/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { HttpExceptionFilter } from '@app/common/filters';
import { HttpLoggingInterceptor, HttpResponseInterceptor } from '@app/common/interceptors';
import { ClassSerializerInterceptor, INestApplication, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { validationPipe } from '../../pipes';
import { getConfig } from '../get-config';

export async function setupBootstrap(app: INestApplication<any>) {
  const logger = new Logger('bootstrap');

  app.enableShutdownHooks();

  const timeZone = getConfig('core.defaultTimeZone', 'Asia/Bangkok');

  process.env.TZ = timeZone;
  const d = new Date().toTimeString();

  logger.verbose(`Current UTC TimeZone ${timeZone}: ${d}`);

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new HttpResponseInterceptor(),
    HttpLoggingInterceptor({ logLevel: 'debug' }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(validationPipe);

  const documentConfig = new DocumentBuilder()
    .setTitle('My Nest App API')
    .setDescription('API documentation for My Nest App')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('/api/docs', app, documentFactory);

  await app.listen(getConfig('core.port', 3000));
}
