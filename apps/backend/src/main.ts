import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // ─── Global Validation Pipe ──────────────────────
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    // ─── Global Exception Filter ────────────────────
    app.useGlobalFilters(new GlobalExceptionFilter());

    // ─── CORS ────────────────────────────────────────
    app.enableCors({
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
    });

    // ─── Swagger API Documentation ───────────────────
    const config = new DocumentBuilder()
        .setTitle('KR-FUELS API')
        .setDescription(
            'REST API for KR-FUELS Accounting System — manages fuel stations (bunks), users, accounts, vouchers, and reminders.',
        )
        .setVersion('1.0.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'JWT-auth',
        )
        .addTag('Auth', 'Authentication & authorization')
        .addTag('Bunks', 'Fuel station management')
        .addTag('Users', 'User account management')
        .addTag('Accounts', 'Chart of accounts (hierarchical)')
        .addTag('Vouchers', 'Daily debit/credit transactions')
        .addTag('Reminders', 'Task & reminder management')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
            filter: true,
        },
    });

    // ─── Start Server ────────────────────────────────
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 KR-FUELS API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
