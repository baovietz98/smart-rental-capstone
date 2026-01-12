// File: backend/src/main.ts
// QUAN TRỌNG: Load .env file TRƯỚC tất cả
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log(
    'DEBUG: DATABASE_URL is',
    process.env.DATABASE_URL ? 'DEFINED' : 'UNDEFINED',
  );
  console.log('DEBUG: Current Directory:', process.cwd());
  // Force restart: 2026-01-13


  // 1. Cấu hình CORS (Để Web Admin và App Mobile gọi được API)
  app.enableCors();

  // 2. Cấu hình Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các field không có trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu có field lạ
      transform: true, // Tự động transform type (string -> number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 3. Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Quản Lý Nhà Trọ API')
    .setDescription('Tài liệu API cho Frontend (Web & Mobile)')
    .setVersion('1.0')
    .addBearerAuth() // Để sau này test tính năng đăng nhập
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Đường dẫn sẽ là /api

  // 4. Chạy Server
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`Swagger Docs is running on: http://0.0.0.0:${port}/api`);
}
bootstrap();
