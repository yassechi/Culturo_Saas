import { ExploitationModule } from './exploitations/exploitation.module';
import { RotationModule } from './rotations/rotation/rotation.module';
import { AmendementModule } from './amendement/amendement.module';
import { TreatmentModule } from './treatment/treatment.module';
import { WateringModule } from './watering/watering.module';
import { LegumeModule } from './vegetables/legume.module';
import { HarvestModule } from './harvest/harvest.module';
import { AppDataSourceOptions } from './data-source';
import { UsersModule } from './users/users.module';
import { OrderModule } from './order/order.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
    OrderModule,
    TreatmentModule,
    WateringModule,
    TreatmentModule,
  ],
})
export class AppModule {}
