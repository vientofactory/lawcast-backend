import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // CORS 설정
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Global prefix 설정
  app.setGlobalPrefix('');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`LawCast Backend is running on: http://localhost:${port}`);
}
bootstrap();
