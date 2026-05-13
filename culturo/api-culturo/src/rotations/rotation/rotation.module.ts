// src/rotation/rotation.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RotationController } from './rotation.controller';
import { RotationService } from './rotation.service';
import { Section } from 'src/entities/section.entity';
import { Vegetable } from 'src/entities/vegetable.entity';
import { SectionPlan } from 'src/entities/section_plan.entity';
import { Board } from 'src/entities/board.entity';
import { Variety } from 'src/entities/variety.entity';
import { FamilyIncompatibility } from 'src/entities/family_incompatibility.entity';
import { Watering } from 'src/entities/watering.entity';
import { Harvest } from 'src/entities/harvest.entity';
import { Observation } from 'src/entities/observation.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Section,
      Vegetable,
      SectionPlan,
      Board,
      Variety,
      FamilyIncompatibility,
      Watering,
      Harvest,
      Observation,
    ]),
    UsersModule,
  ],
  controllers: [RotationController],
  providers: [RotationService],
  exports: [RotationService],
})
export class RotationModule {}