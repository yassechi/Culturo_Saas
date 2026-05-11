import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateObservationDTO {
  @ApiProperty({ description: 'Section observée', example: 12 })
  @IsInt()
  @IsNotEmpty()
  sectionId: number;

  @ApiProperty({
    description: "Date de l'observation au format AAAA-MM-JJ",
    example: '2026-05-11',
  })
  @IsDateString()
  @IsNotEmpty()
  observationDate: string;

  @ApiProperty({
    description: 'Maladie observée',
    example: 'Mildiou léger',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  diseaseObserved?: string;

  @ApiProperty({
    description: 'Ravageur observé',
    example: 'Pucerons',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  pestObserved?: string;

  @ApiProperty({
    description: 'Conditions météo notables',
    example: 'Pluie la veille, humidité élevée',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  weatherConditions?: string;

  @ApiProperty({
    description: 'État global de la plante',
    enum: ['bon', 'moyen', 'mauvais'],
    example: 'moyen',
  })
  @IsString()
  @IsIn(['bon', 'moyen', 'mauvais'])
  plantStatus: 'bon' | 'moyen' | 'mauvais';

  @ApiProperty({
    description: 'Observation libre détaillée',
    example: 'Présence de taches sur plusieurs feuilles basses.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(4000)
  notes: string;
}
