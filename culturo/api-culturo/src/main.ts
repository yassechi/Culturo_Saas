import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // CORS
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('Culturo API')
    .setDescription("L'API de la gestion de l'application Culturo")
    .addServer('http://localhost:3000')
    .setTermsOfService('http://localhost:3000/terms-of-service')
    .setLicense('MIT License', 'https://google.com')
    .setVersion('1.0')
    .addSecurity('bearer', { type: 'http', scheme: 'bearer' }) //Pour l'auth Token
    .addBearerAuth() //Pour l'auth Token
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Route Swagger
  SwaggerModule.setup('swagger', app, document);

  // Lancement du serveur
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();
