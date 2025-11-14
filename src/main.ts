import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Global prefix 설정
  app.setGlobalPrefix('');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 LawCast Backend is running on: http://localhost:${port}`);
}
bootstrap();
