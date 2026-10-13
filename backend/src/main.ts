import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLogger } from './common/logger';

const logger = createLogger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN as string,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.info(`[BOOTSTRAP_SUCCESS] Application started on port ${port}`, {
    context: 'Bootstrap',
    port,
    environment: process.env.NODE_ENV || 'development',
  });
}

bootstrap().catch((error) => {
  logger.error('[BOOTSTRAP_FAILED] Error starting application', {
    context: 'Bootstrap',
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
