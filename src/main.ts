import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serve static files for attachments
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Setup Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('幻想记录 API')
    .setDescription('幻想记录后端API文档 - 一个用于记录创意想法和情感的应用')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('用户认证', '用户注册、登录和资料管理')
    .addTag('记录管理', '幻想记录的增删改查')
    .addTag('标签管理', '标签的管理和使用')
    .addTag('附件管理', '文件上传和附件管理')
    .addTag('数据分析', '心情趋势和统计分析')
    .addTag('AI分析', 'AI驱动的心理状态和可行性分析')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger API documentation: http://localhost:${port}/api`);
}
bootstrap();
