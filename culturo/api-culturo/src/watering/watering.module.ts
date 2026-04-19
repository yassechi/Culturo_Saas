// src/watering/watering.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WateringController } from './watering.controller';
import { WateringService } from './watering.service';
import { Watering } from '../entities/watering.entity';
import { Section } from '../entities/section.entity'; // Ajoutez
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Watering,
      Section, // Ajoutez
    ]),
    UsersModule,
  ],
  controllers: [WateringController],
  providers: [WateringService],
  exports: [WateringService],
})
export class WateringModule {}