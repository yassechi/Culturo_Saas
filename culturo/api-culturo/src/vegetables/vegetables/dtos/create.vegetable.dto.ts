import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVarietyDTO } from 'src/vegetables/varieties/dtos/create.vartiety.dto';

export class CreateVegetableDTO {
  @ApiProperty({ example: 'Carotte', description: 'Nom du légume' })
  @IsString()
  @IsNotEmpty()
  vegetable_name: string;

  @ApiProperty({ example: 'Printemps', description: 'Saison de plantation' })
  @IsString()
  @IsNotEmpty()
  planting_season: string;

  @ApiProperty({ example: 'Été', description: 'Saison de récolte' })
  @IsString()
  @IsNotEmpty()
  harvest_season: string;

  @ApiProperty({
    example: 90,
    description: 'Durée minimale de récolte en jours',
  })
  @IsInt()
  @Min(1)
  harvest_duration_min: number;

  @ApiProperty({
    example: 120,
    description: 'Durée maximale de récolte en jours',
  })
  @IsInt()
  @Min(1)
  harvest_duration_max: number;

  @ApiProperty({
    example: 5,
    description: 'Distance entre les plants dans la rangée (cm)',
  })
  @IsInt()
  @Min(1)
  inrow_distance: number;

  @ApiProperty({
    example: 30,
    description: 'Espacement entre les rangées (cm)',
  })
  @IsInt()
  @Min(1)
  in_row_spacing: number;

  @ApiProperty({
    example: 100,
    description: 'Rendement estimé par surface (kg)',
  })
  @IsInt()
  @Min(1)
  estimated_yield: number;

  @ApiProperty({ example: 8, description: 'ID de la famille du légume' })
  @IsInt()
  id_family: number;

  @ApiProperty({
    type: [CreateVarietyDTO],
    description: 'Liste des variétés de ce légume',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVarietyDTO)
  @IsOptional()
  varieties?: CreateVarietyDTO[];
}
