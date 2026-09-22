import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as bodyParser from 'body-parser'; // 1. Import body-parser
import session from 'express-session';
import passport from 'passport';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 2. Tăng giới hạn payload (Ví dụ: 50MB)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Bật Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Cấu hình Session cho OAuth 1.0 (Twitter)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'shoptech-secret-key',
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // Cấu hình thư mục tĩnh để xem được ảnh
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('ShopTech API')
    .setDescription('Tài liệu mô tả các API cho hệ thống E-commerce ShopTech')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Thêm CORS
  app.enableCors();

  await app.listen(3001);
  console.log('Application is running on: http://localhost:3001');
}
bootstrap();