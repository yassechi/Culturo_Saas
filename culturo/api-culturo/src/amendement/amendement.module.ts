import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmendedController, CatalogueController } from './amendement.controller';
import { AmendedService } from './amendement.service';
import { Amended } from '../entities/amended.entity';
import { Amendement } from '../entities/amendement.entity';
import { Board } from '../entities/board.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Amended, Amendement, Board]),
    UsersModule,
  ],
  controllers: [CatalogueController, AmendedController],
  providers: [AmendedService],
  exports: [AmendedService],
})
export class AmendementModule {}
