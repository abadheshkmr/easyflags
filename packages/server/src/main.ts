import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { initializeDatabase } from './db/database-init';

async function bootstrap() {
  // Check for database existence in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    const logger = new Logger('Bootstrap');
    logger.log('Running in development mode - checking database...');
    
    // Get database config from environment variables
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '5432', 10);
    const username = process.env.DB_USERNAME || 'postgres';
    const password = process.env.DB_PASSWORD || 'postgres';
    const database = process.env.DB_NAME || 'feature_flags';
    
    try {
      await initializeDatabase(host, port, username, password, database);
      logger.log('Database initialization complete');
    } catch (error) {
      logger.error('Database initialization failed, but continuing startup');
    }
  }
  
  // Create the NestJS application
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Feature Flags API')
    .setDescription('API for managing feature flags')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  // Create Swagger document with path transformations to fix double prefix issue
  const document = SwaggerModule.createDocument(app, config);
  
  // Post-process document to remove duplicate api/v1 prefixes 
  // This is needed due to the way NestJS combines controller prefixes with global versioning
  Object.keys(document.paths).forEach(path => {
    if (path.includes('/api/v1/api/v1/')) {
      const fixedPath = path.replace('/api/v1/api/v1/', '/api/v1/');
      document.paths[fixedPath] = document.paths[path];
      delete document.paths[path];
      console.log(`Fixed Swagger path: ${path} → ${fixedPath}`);
    }
  });

  // Set up Swagger UI
  SwaggerModule.setup('api-docs', app, document);

  // Start the server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Display helpful startup information
  const divider = "=".repeat(50);
  console.log(divider);
  console.log(`🚀 Feature Flag Service started successfully`);
  console.log(divider);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`💻 Server         : http://localhost:${port}`);
  console.log(`🌐 Environment    : ${process.env.NODE_ENV || 'development'}`);
  console.log(`📜 API Versioning : Enabled (prefix: 'api/v')`);
  console.log(divider);

  // Print all accessible routes for easy reference
  console.log('\n📋 API Routes Reference:');
  try {
    const server = app.getHttpServer();
    
    // Add safety checks to avoid 'Cannot read properties of undefined' error
    if (server && 
        server._events && 
        server._events.request && 
        server._events.request._router) {
        
      const router = server._events.request._router;

      // Only proceed if router.stack exists
      if (router.stack) {
        // Extract routes and sort them for easier reading
        const availableRoutes = router.stack
          .filter(layer => layer.route)
          .map(layer => {
            const route = layer.route;
            const path = route.path;
            const method = Object.keys(route.methods)[0].toUpperCase();
            return { path, method };
          })
          .sort((a, b) => a.path.localeCompare(b.path));

        // Group routes by base path for cleaner display
        const groupedRoutes = {};
        availableRoutes.forEach(route => {
          const basePath = route.path.split('/').slice(0, 3).join('/');
          if (!groupedRoutes[basePath]) {
            groupedRoutes[basePath] = [];
          }
          groupedRoutes[basePath].push(route);
        });

        // Display the routes
        Object.keys(groupedRoutes).sort().forEach(basePath => {
          console.log(`\n${basePath}`);
          groupedRoutes[basePath].forEach(route => {
            console.log(`  ${route.method.padEnd(7)} ${route.path}`);
          });
        });
      } else {
        console.log('⚠️ Router stack not accessible. Route explorer disabled.');
      }
    } else {
      console.log('⚠️ Express router not fully initialized. Route explorer disabled.');
    }
  } catch (error) {
    console.error('⚠️ Error accessing routes:', error.message);
  }
}

bootstrap(); 