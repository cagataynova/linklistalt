import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const allowedOrigins = config
    .get<string>('FRONTEND_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());
  app.use(helmet());
  app.enableCors({
    credentials: true,
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      const allowed =
        !origin ||
        allowedOrigins.some((pattern) => {
          if (pattern === origin) return true;
          if (!pattern.includes('*')) return false;
          const expression = pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replaceAll('*', '[a-zA-Z0-9-]+');
          return new RegExp(`^${expression}$`).test(origin);
        });
      callback(allowed ? null : new Error('CORS origin rejected'), allowed);
    },
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LinkList API')
    .setDescription('LinkList davetli beta HTTP API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  await app.listen(config.get<number>('PORT', 3001), '0.0.0.0');
}

void bootstrap();
