import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantStock } from 'src/entities/plant_stock.entity';
import { Vegetable } from 'src/entities/vegetable.entity';
import { Variety } from 'src/entities/variety.entity';
import { Exploitation } from 'src/entities/exploitation.entity';
import { PlantStockService } from './plant-stock.service';
import { PlantStockController } from './plant-stock.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlantStock, Vegetable, Variety, Exploitation]),
    UsersModule,
  ],
  controllers: [PlantStockController],
  providers: [PlantStockService],
  exports: [PlantStockService],
})
export class PlantStockModule {}
