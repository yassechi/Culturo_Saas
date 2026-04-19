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
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Section,
      Vegetable,
      SectionPlan,
      Board,
      Variety, // Ajoutez cette ligne
    ]),
    UsersModule,
  ],
  controllers: [RotationController],
  providers: [RotationService],
  exports: [RotationService],
})
export class RotationModule {}