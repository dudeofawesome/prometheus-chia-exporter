import { NestFactory } from '@nestjs/core';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import * as Package from '../package.json';
import { AppModule } from './app.module';

import 'source-map-support/register';

async function bootstrap() {
  const app = (await NestFactory.create(AppModule, { bodyParser: false }))
    .use(compression())
    .use(helmet());

  // const options = new DocumentBuilder()
  //   .setTitle(
  //     Package.name
  //       .split('-')
  //       .map(w => `${w.slice(0, 1).toUpperCase()}${w.slice(1)}`)
  //       .join(' '),
  //   )
  //   .setDescription(Package.description)
  //   .setVersion(Package.version)
  //   .build();
  // const document = SwaggerModule.createDocument(app, options);
  // SwaggerModule.setup('openapi', app, document);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT || 9133);
}

bootstrap();
