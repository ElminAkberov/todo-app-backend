import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

// The compiled entrypoint lives at dist/src/main.js, so docs/ sits two levels
// up from __dirname in production but one level up when running from source.
function loadOpenApiDocument(): OpenAPIObject {
  const candidates = [
    join(__dirname, '..', '..', 'docs', 'openapi.yaml'),
    join(__dirname, '..', 'docs', 'openapi.yaml'),
    join(process.cwd(), 'docs', 'openapi.yaml'),
  ];

  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) {
    throw new Error(
      `docs/openapi.yaml not found. Looked in:\n${candidates.join('\n')}`,
    );
  }

  return parse(readFileSync(path, 'utf8')) as OpenAPIObject;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [
      'http://localhost:5173',
      'https://todo-app-beta-two-32.vercel.app',
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const document = loadOpenApiDocument();
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger/json',
    yamlDocumentUrl: 'swagger/yaml',
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
