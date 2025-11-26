// File: backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Cấu hình CORS (Để Web Admin và App Mobile gọi được API)
  app.enableCors();

  // 2. Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Quản Lý Nhà Trọ API')
    .setDescription('Tài liệu API cho Frontend (Web & Mobile)')
    .setVersion('1.0')
    .addBearerAuth() // Để sau này test tính năng đăng nhập
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Đường dẫn sẽ là /api

  // 3. Chạy Server
  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
  console.log(`Swagger Docs is running on: http://localhost:3000/api`);
}
bootstrap();