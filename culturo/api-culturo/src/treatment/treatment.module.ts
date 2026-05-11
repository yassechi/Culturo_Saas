import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatedController, TreatmentCatalogueController } from './treatment.controller';
import { TreatedService } from './treatment.service';
import { Treated } from '../entities/treated.entity';
import { Treatment } from '../entities/treatment.entity';
import { Board } from '../entities/board.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Treated, Treatment, Board]),
    UsersModule,
  ],
  controllers: [TreatmentCatalogueController, TreatedController],
  providers: [TreatedService],
  exports: [TreatedService],
})
export class TreatmentModule {}
