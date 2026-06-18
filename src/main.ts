import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cookie and session configuration for stateful web panel auth
  app.use(cookieParser());
  app.use(
    session({
      secret: 'FleetPulseSessionSecretKey456',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000, // 1 hour session duration
        httpOnly: true,
        secure: false, // set to true in production with HTTPS
      },
    }),
  );

  // Setup EJS MVC views directory and engine
  app.setBaseViewsDir(join(__dirname, '..', 'src', 'views'));
  app.setViewEngine('ejs');

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Enable global DTO validation & transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Register global exception filter to handle API error JSON and web error page rendering
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(3000);
  console.log('--------------------------------------------------');
  console.log('FleetPulse Logistics & Tracking Panel Running');
  console.log('Local Web Panel URL:  http://localhost:3000');
  console.log('Pre-seeded Admin User: admin / adminPassword123');
  console.log('API Key for testing:   x-api-key: FleetPulseSecretKey123');
  console.log('--------------------------------------------------');
}
bootstrap();
