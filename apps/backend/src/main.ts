/**
 * Family Planner Backend API
 * 
 * Production-ready NestJS application with:
 * - Swagger/OpenAPI documentation
 * - Global validation pipe
 * - CORS configuration
 * - Graceful shutdown handling
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global API prefix: /api (but /v1 routes will be /api/v1)
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable CORS for frontend access
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global Validation Pipe
  // Validates all DTOs with class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert types (string → number, etc.)
      },
    })
  );

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Family Planner API')
    .setDescription(
      'REST API for managing family schedules, activities, meals, and recurring goals. ' +
      'This API provides endpoints for creating, retrieving, updating, and deleting weekly schedules with AI-powered generation.'
    )
    .setVersion('1.0')
    .addTag('Weekly Schedules', 'Endpoints for managing weekly schedules')
    .addTag('Health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token from Supabase Auth',
        name: 'Authorization',
        in: 'header',
      },
      'JWT-auth'
    )
    .addServer(`http://localhost:${process.env.PORT || 3000}`, 'Development server')
    .addServer('https://api.family-planner.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Family Planner API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Log startup information
  logger.log('╔════════════════════════════════════════════╗');
  logger.log('║   Family Planner Backend API Started      ║');
  logger.log('╚════════════════════════════════════════════╝');
  logger.log('');
  logger.log(`🚀 Server:        http://localhost:${port}/${globalPrefix}`);
  logger.log(`📚 Swagger Docs:  http://localhost:${port}/${globalPrefix}/docs`);
  logger.log(`📊 Health Check:  http://localhost:${port}/${globalPrefix}/health`);
  logger.log(`🔒 Auth:          JWT Bearer Token (Supabase)`);
  logger.log(`🗄️  Database:      PostgreSQL (Supabase)`);
  logger.log(`🌍 Environment:   ${process.env.NODE_ENV || 'development'}`);
  logger.log('');
  logger.log('Available endpoints:');
  logger.log(`  GET  /${globalPrefix}/v1/weekly-schedules/:id`);
  logger.log('');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM signal received: closing HTTP server');
    await app.close();
    logger.log('HTTP server closed');
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT signal received: closing HTTP server');
    await app.close();
    logger.log('HTTP server closed');
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start application', error.stack);
  process.exit(1);
});
