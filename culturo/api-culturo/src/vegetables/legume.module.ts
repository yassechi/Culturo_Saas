import { Family_importance } from 'src/entities/family_importance.entity';
import { VegetableController } from './vegetables/vegetable.controller';
import { FamilyController } from './families/family.controller';
import { VegetableService } from './vegetables/vegetable.service';
import { Vegetable } from 'src/entities/vegetable.entity';
import { FamilyService } from './families/family.service';
import { Section } from 'src/entities/section.entity';
import { Family } from 'src/entities/family.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { VarietyController } from './varieties/variety.controller';
import { VarietyService } from './varieties/variety.service';
import { Variety } from 'src/entities/variety.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Family,
      Vegetable,
      Family_importance,
      Section,
      Variety,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          global: true,
          secret: config.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: '1d',
          },
        };
      },
    }),
  ],
  controllers: [FamilyController, VegetableController, VarietyController],
  providers: [VegetableService, FamilyService, VarietyService],
})
export class LegumeModule {}
