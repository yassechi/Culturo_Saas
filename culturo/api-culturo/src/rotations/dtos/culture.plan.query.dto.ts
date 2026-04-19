import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CulturePlanQueryDto {
  @ApiProperty({
    description:
      "L'année du plan de culture. Doit être un entier supérieur ou égal à 2000.",
    example: 2025,
    minimum: 2000,
    type: Number,
  })
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year: number;

  @ApiProperty({
    description:
      "Le mois de départ de la période du plan (1 pour Janvier, 12 pour Décembre). Optionnel. Si omis, commence au 1er janvier de l'année.",
    example: 3,
    minimum: 1,
    maximum: 12,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiProperty({
    description:
      'La durée en mois à inclure dans le plan de culture, à partir du mois de départ. Doit être positif. Optionnel.',
    example: 6,
    minimum: 1,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  periodMonths?: number;
}
