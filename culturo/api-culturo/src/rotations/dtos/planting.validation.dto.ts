import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PlantingValidationDto {
  @ApiProperty({
    description:
      "L'ID unique de la planche (board) où la plantation est envisagée.",
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  boardId: number;

  @ApiProperty({
    description: "L'ID unique du légume (vegetable) à planter.",
    example: 21, // Ex: Tomate Ancienne
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  vegetableId: number;

  @ApiProperty({
    description:
      'Indique si les avertissements de rotation (règle des 5 ans ou cohabitation) doivent être contournés (true) ou non (false).',
    example: false,
    required: false,
    default: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  bypass?: boolean;

  @ApiProperty({
    description:
      "Date de début de plantation pour vérifier la saisonnalité agronomique.",
    example: '2026-04-15',
    required: false,
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description:
      "Date de fin prévisionnelle de culture. Utilisée pour valider la cohérence du scénario.",
    example: '2026-07-30',
    required: false,
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
