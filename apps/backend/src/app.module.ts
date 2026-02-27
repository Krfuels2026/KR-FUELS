import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { BunksModule } from './modules/bunks/bunks.module';
import { UsersModule } from './modules/users/users.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { SeedModule } from './database/seed/seed.module';

@Module({
    imports: [
        // ─── Environment Configuration ─────────────────
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // ─── Database Connection ───────────────────────
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('DB_HOST', 'localhost'),
                port: config.get<number>('DB_PORT', 5432),
                username: config.get<string>('DB_USERNAME', 'postgres'),
                password: config.get<string>('DB_PASSWORD', 'postgres'),
                database: config.get<string>('DB_NAME', 'kr_fuels'),
                autoLoadEntities: true,
                synchronize: config.get<string>('NODE_ENV') !== 'production',
                logging: config.get<string>('NODE_ENV') === 'development',
            }),
        }),

        // ─── Feature Modules ───────────────────────────
        AuthModule,
        BunksModule,
        UsersModule,
        AccountsModule,
        VouchersModule,
        RemindersModule,
        SeedModule,
    ],
})
export class AppModule { }
