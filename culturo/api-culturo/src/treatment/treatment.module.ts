// src/treatment/treatment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatedController } from './treatment.controller';
import { TreatedService } from './treatment.service';
import { Treated } from '../entities/treated.entity';
import { Board } from '../entities/board.entity'; // Ajoutez
import { Treatment } from '../entities/treatment.entity'; // Ajoutez
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Treated,
      Board, // Ajoutez
      Treatment, // Ajoutez
    ]),
    UsersModule,
  ],
  controllers: [TreatedController],
  providers: [TreatedService],
  exports: [TreatedService],
})
export class TreatmentModule {}