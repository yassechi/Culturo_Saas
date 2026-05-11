import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Observation } from 'src/entities/observation.entity';
import { Section } from 'src/entities/section.entity';
import { User_ } from 'src/entities/user_.entity';
import { UsersModule } from 'src/users/users.module';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Observation, Section, User_]), UsersModule],
  controllers: [ObservationsController],
  providers: [ObservationsService],
  exports: [ObservationsService],
})
export class ObservationsModule {}
