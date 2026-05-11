import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateTreatedDTO {
  @ApiProperty({ description: 'Date du traitement (YYYY-MM-DD)', example: '2026-05-11' })
  @IsString()
  @IsNotEmpty()
  treatment_date: string;

  @ApiProperty({ description: 'ID du type de traitement (catalogue)', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id_treatment: number;

  @ApiProperty({ description: 'ID de la planche', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id_board: number;

  @ApiProperty({ description: 'Quantité appliquée', example: 50, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  treatment_quantity?: number;

  @ApiProperty({ description: 'Unité de mesure', example: 'mL', required: false })
  @IsOptional()
  @IsString()
  treatment_unit?: string;

  @ApiProperty({ description: 'Notes libres', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateBulkTreatedDTO {
  @ApiProperty({ description: 'Date du traitement (YYYY-MM-DD)', example: '2026-05-11' })
  @IsString()
  @IsNotEmpty()
  treatment_date: string;

  @ApiProperty({ description: 'ID du type de traitement (catalogue)', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id_treatment: number;

  @ApiProperty({ description: 'ID de la sole (toutes les planches actives)', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id_sole: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  treatment_quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  treatment_unit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTreatmentCatalogueDTO {
  @ApiProperty({ example: 'Bouillie bordelaise' })
  @IsString()
  @IsNotEmpty()
  treatment_name: string;

  @ApiProperty({ required: false, example: 'Fongicide préventif à base de cuivre. Diluer 20g/L.' })
  @IsOptional()
  @IsString()
  notice?: string;
}

export class UpdateTreatmentCatalogueDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  treatment_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notice?: string;
}
