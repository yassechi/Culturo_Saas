import { SupplierModule } from './suppliers/supplier.module';
import { PlantStockModule } from './plant-stock/plant-stock.module';
import { SupplierOrderModule } from './supplier-orders/supplier-order.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ExploitationModule } from './exploitations/exploitation.module';
import { RotationModule } from './rotations/rotation/rotation.module';
import { AmendementModule } from './amendement/amendement.module';
import { TreatmentModule } from './treatment/treatment.module';
import { WateringModule } from './watering/watering.module';
import { LegumeModule } from './vegetables/legume.module';
import { HarvestModule } from './harvest/harvest.module';
import { ObservationsModule } from './observations/observations.module';
import { AppDataSourceOptions } from './data-source';
import { UsersModule } from './users/users.module';
import { OrderModule } from './order/order.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

const envFilePath =
  process.env.NODE_ENV === 'production'
    ? ['.env.prod', '.env']
    : ['.env.dev', '.env'];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: config.get<number>('THROTTLE_TTL', 60000),
        limit: config.get<number>('THROTTLE_LIMIT', 100),
      }]),
    }),
    TypeOrmModule.forRoot(AppDataSourceOptions),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),

    UsersModule,
    LegumeModule,
    ExploitationModule,
    RotationModule,
    AmendementModule,
    HarvestModule,
    ObservationsModule,
    OrderModule,
    TreatmentModule,
    WateringModule,
    SupplierModule,
    PlantStockModule,
    SupplierOrderModule,
    StatisticsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
